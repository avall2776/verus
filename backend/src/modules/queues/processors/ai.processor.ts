import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from '../../ai/ai.service';
import { MessagingService } from '../../messaging/messaging.service';
import { ChatGateway } from '../../chat/chat.gateway';

@Processor('ai-processing')
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly messagingService: MessagingService,
    private readonly chatGateway: ChatGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, conversationId, contactId, formName, source } = job.data;
    
    this.logger.debug(`Iniciando orquestração de IA para a conversa [${conversationId}]`);

    // 1. A REGRA DE OURO (Trava Handoff)
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: { include: { tenant: true } } }
    });

    if (!conversation) {
      throw new Error(`Conversa ${conversationId} não encontrada.`);
    }

    // Trava de Atendimento Humano: Se a conversa foi assumida ou está com operador humano, aborta imediatamente!
    const isHumanHandled =
      conversation.status === 'human_takeover' ||
      conversation.status === 'open' ||
      conversation.status === 'in_progress' ||
      Boolean(conversation.assignedTo);

    if (isHumanHandled) {
      this.logger.warn(`[AiProcessor] Conversa [${conversationId}] sob controle humano (status: ${conversation.status}, assignedTo: ${conversation.assignedTo}). Abortando IA.`);
      return { status: 'aborted', reason: 'human_takeover_active' };
    }

    if (conversation.status !== 'bot_active') {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'bot_active' }
      });
    }

    // 1.1 Trava Master da Empresa: Verifica se o auto-atendimento por IA está ligado
    if (conversation.contact.tenant?.aiEnabled === false) {
      this.logger.warn(`Tenant [${conversation.contact.tenant?.name || tenantId}] com auto-atendimento por IA DESLIGADO nas Configurações. Abortando IA.`);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'waiting' }
      });
      return { status: 'aborted', reason: 'ai_disabled_for_tenant' };
    }

    // 1.2 Trava de Conexão: Verifica se a instância do WhatsApp do Tenant está realmente conectada
    const connectedInst = await this.prisma.whatsAppInstance.findFirst({
      where: { tenantId, status: 'connected' }
    });

    if (!connectedInst) {
      this.logger.warn(`Tenant [${tenantId}] sem conexão WhatsApp ativa. Pausando IA para a conversa [${conversationId}].`);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'waiting' }
      });
      return { status: 'aborted', reason: 'WhatsApp disconnected' };
    }

    // 1.3 Trava de Degustação / Chave OpenAI (BYOK & Super Admin Bypass)
    const tenant = conversation.contact.tenant;
    const keyResolution = this.aiService.resolveTenantApiKey(tenant);
    if (!keyResolution.canUseAi) {
      this.logger.warn(
        `Tenant [${tenant?.name || tenantId}] com degustação de IA expirada (${keyResolution.statusText}). Transferindo conversa [${conversationId}] para fila de espera humana.`
      );
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'waiting' },
      });
      return { status: 'aborted', reason: 'ai_trial_expired_no_byok' };
    }

    // 2. Extrair Contexto (Últimas 15 mensagens, ordenadas da mais antiga para a mais nova)
    const historyDb = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    if (historyDb.length === 0) {
      return { status: 'aborted', reason: 'Empty history' };
    }

    const latestMessage = historyDb[0];

    // Anti-loop 1: Nunca responde se a última mensagem já foi do sistema ou bot
    if (latestMessage.senderType !== 'contact') {
      this.logger.warn(`Última mensagem da conversa [${conversationId}] não é do contato. Evitando auto-resposta / loop.`);
      return { status: 'aborted', reason: 'Last message not from contact' };
    }

    // Anti-loop 2: Detecção de auto-resposta de outro bot / fora de expediente de cliente
    const autoReplySignatures = [
      'mensagem automática',
      'resposta automática',
      'atendimento automático',
      'horário de atendimento',
      'estamos ausentes',
      'retornaremos em breve',
      'fora do expediente',
      'auto-reply',
      'automatic reply',
      'agradecemos seu contato',
      'nosso horário é de',
      'este número não recebe chamadas',
    ];
    const incomingText = (latestMessage.content || '').toLowerCase();
    const isBotAutoReply = autoReplySignatures.some(sig => incomingText.includes(sig));

    if (isBotAutoReply) {
      this.logger.warn(`Mensagem recebida na conversa [${conversationId}] identificada como auto-resposta de outro bot. Pausando IA para evitar loop.`);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'waiting' }
      });
      return { status: 'aborted', reason: 'Detected bot auto-reply loop' };
    }

    // Anti-loop 3: Frequência anormal de mensagens (mais de 6 mensagens nos últimos 2 minutos)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentCount = await this.prisma.message.count({
      where: {
        conversationId,
        createdAt: { gte: twoMinutesAgo }
      }
    });

    if (recentCount >= 6) {
      this.logger.warn(`Frequência anormal de mensagens na conversa [${conversationId}] (${recentCount} msgs em 2min). Pausando IA para segurança.`);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'waiting' }
      });
      return { status: 'aborted', reason: 'Loop frequency limit exceeded' };
    }

    const historyForAi: { role: 'user'|'assistant', content: string }[] = [...historyDb]
      .reverse() // Transforma para ordem cronológica (antiga -> nova)
      .map(msg => ({
        role: msg.senderType === 'contact' ? 'user' : 'assistant',
        content: msg.content
      }));

    // 2.5 Buscar Histórico Recente no CRM (Para dar memória longa à IA)
    const pastDeals = await this.prisma.deal.findMany({
      where: { contactId: conversation.contact.id },
      orderBy: { updatedAt: 'desc' },
      take: 2,
    });

    let dynamicContext = `\n\n=== CONTEXTO DO CLIENTE ===\nNome do Cliente: ${conversation.contact.name}\n`;
    if (pastDeals.length > 0) {
      dynamicContext += `O cliente já teve os seguintes atendimentos anteriores (use para ter contexto, não repita se não for necessário):\n`;
      pastDeals.forEach(d => {
        dynamicContext += `- Interesse Anterior: ${d.title} | Notas: ${d.notes || 'Sem detalhes'}\n`;
      });
    }

    // 3. Chamar OpenAI com a configuração dinâmica do Tenant e o Contexto
    this.logger.log(`Enviando ${historyForAi.length} mensagens de histórico para a OpenAI (Tenant: ${conversation.contact.tenant.name})...`);
    const aiResponse = await this.aiService.processConversation(historyForAi, conversation.contact.tenant, dynamicContext);

    // 3.5 Análise de Inteligência Emocional e Registro de Incidentes de Aprendizado (Fase 86)
    const isHostileOrFrustrated =
      aiResponse.sentimento_cliente === 'FRUSTRADO_IRRITADO' ||
      aiResponse.sentimento_cliente === 'HOSTIL_RECLAMACAO';
    const complainedOfBot = Boolean(aiResponse.reclamou_de_bot);

    if (isHostileOrFrustrated || complainedOfBot) {
      this.logger.warn(`[Emotional Intelligence] Atrito detectado no WhatsApp: sentimento=${aiResponse.sentimento_cliente}, reclamou_de_bot=${complainedOfBot}. Ativando salvaguardas.`);

      // Força transbordo para humano se o cliente estiver visivelmente irritado ou reclamou de bot
      aiResponse.transferir_vendedor = true;
      if (!aiResponse.motivo_transferencia || aiResponse.motivo_transferencia === 'Dúvida complexa') {
        aiResponse.motivo_transferencia = complainedOfBot
          ? 'Cliente insatisfeito com atendimento automatizado/robô'
          : `Cliente demonstrou frustração/irritação (${aiResponse.sentimento_cliente})`;
      }

      // Registra incidente para ciclo de aprendizado contínuo (Human-in-the-loop)
      try {
        const lastUserMsg = historyForAi.filter(m => m.role === 'user').pop()?.content || '';
        let tipoIncidente = 'FRUSTRACAO_RESPOSTA';
        let sugestaoDiretriz = 'Adotar postura mais empática e concisa ao esclarecer dúvidas, evitando explicações prolixas e priorizando a resposta direta e objetiva.';

        if (complainedOfBot) {
          tipoIncidente = 'RECLAMACAO_ROBO';
          sugestaoDiretriz = 'Quando o cliente perguntar se você é um robô ou demonstrar desconfiança, seja transparente com carisma, valide a percepção dele com simpatia e ofereça transferência humana imediata sem insistência.';
        } else if (aiResponse.sentimento_cliente === 'HOSTIL_RECLAMACAO') {
          tipoIncidente = 'HOSTILIDADE_CLIENTE';
          sugestaoDiretriz = 'Diante de qualquer reclamação ou rispidez do cliente, pedir desculpas pela má experiência com humildade e acolhimento sincero, sem justificar falhas, repassando o caso de imediato a um gerente comercial.';
        }

        await this.prisma.aiLearningIncident.create({
          data: {
            tenantId,
            conversationId,
            contactId,
            sentimento: aiResponse.sentimento_cliente || 'FRUSTRADO_IRRITADO',
            tipoIncidente,
            reclamouDeBot: complainedOfBot,
            trechoCliente: lastUserMsg.slice(0, 1000),
            respostaIa: (aiResponse.resposta_cliente || '').slice(0, 1000),
            diagnosticoCausa: aiResponse.analise_emocional || 'O cliente demonstrou desconforto ou atrito durante o atendimento da IA.',
            sugestaoDiretriz,
            status: 'PENDENTE'
          }
        });
        this.logger.log(`[AiLearningIncident] Incidente de aprendizado registrado com sucesso para análise do gestor.`);
      } catch (incErr: any) {
        this.logger.error(`[AiLearningIncident] Erro não-bloqueante ao registrar incidente: ${incErr.message}`);
      }
    }

    // 4. Despachar a resposta para o Lead
    if (aiResponse.resposta_cliente) {
      // Remove estritamente qualquer asterisco de markdown para formatação natural do WhatsApp
      const cleanContent = aiResponse.resposta_cliente.replace(/\*/g, '').trim();

      // O MessagingService se encarrega de disparar via driver compatível (Evolution API ou Meta API)
      const sendRes = await this.messagingService.sendText({
        tenantId,
        phone: conversation.contact.phone,
        content: cleanContent
      });

      const messageStatus = sendRes?.success ? 'delivered' : 'failed';
      const providerMsgId = sendRes?.messageId || `out_${Date.now()}`;

      if (!sendRes?.success) {
        this.logger.error(`Falha ao despachar resposta da IA para ${conversation.contact.phone}: ${sendRes?.error}`);
      }

      // Salva a nossa própria resposta no banco com status real do disparo
      const savedMsg = await this.prisma.message.create({
        data: {
          tenantId,
          conversationId,
          contactId,
          providerMessageId: providerMsgId,
          content: cleanContent,
          direction: 'OUTBOUND',
          senderType: 'system',
          status: messageStatus, 
        }
      });

      // Emitir para o front-end (Chat)
      this.chatGateway.emitNewMessage(tenantId, {
        ...savedMsg,
        contact: { phone: conversation.contact.phone, name: conversation.contact.name }
      });
    }

    // 4.5 Enriquecimento contínuo de Contato, Região/Setor e Deal a partir da inteligência extraída pela IA
    let resolvedDeptId: string | null = conversation.departmentId || null;
    try {
      const contactUpdateData: any = {};
      if (aiResponse.email_cliente && !conversation.contact.email) {
        contactUpdateData.email = aiResponse.email_cliente;
      }
      // REGRA DE SEGURANÇA MÁXIMA: A IA NUNCA deve sobrescrever o nome do contato (contact.name).
      // Contatos devem manter seu nome oficial do WhatsApp (pushName) ou telefone limpo,
      // sem renomeação por achismo ou menções a anúncios/empresa (ex: 'Verto Agrícola').

      let extractedState: string | null = (conversation.contact as any).state || null;
      if (aiResponse.cidade_uf && aiResponse.cidade_uf !== 'Não informado') {
        const ufMatch = String(aiResponse.cidade_uf).toUpperCase().match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
        if (ufMatch) {
          extractedState = ufMatch[1];
          contactUpdateData.state = extractedState;
        }
        const cityPart = String(aiResponse.cidade_uf).split(/[-/,]/)[0]?.trim();
        if (cityPart && cityPart.length >= 2) {
          contactUpdateData.city = cityPart;
        }
      }

      if (Object.keys(contactUpdateData).length > 0) {
        await this.prisma.contact.update({
          where: { id: contactId },
          data: contactUpdateData,
        }).catch(() => {});
      }

      // Classificação Inteligente e Automática da Região/Setor (Prioriza Setor Especializado se identificado pela IA)
      const targetSector = aiResponse.setor_destino || 'COMERCIAL';
      const candidatePhone = aiResponse.telefone_cliente || conversation.contact.phone;
      let autoDeptId: string | null = null;

      if (targetSector !== 'COMERCIAL') {
        autoDeptId = await this.resolveSpecializedDepartment(tenantId, targetSector);
      }
      if (!autoDeptId) {
        autoDeptId = await this.resolveDepartmentSmart(tenantId, candidatePhone, extractedState);
      }

      if (autoDeptId) {
        resolvedDeptId = autoDeptId;
        if (conversation.departmentId !== autoDeptId) {
          const convWithDept = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { departmentId: autoDeptId },
            include: {
              contact: true,
              department: { select: { id: true, name: true, color: true } },
            },
          }).catch(() => null);

          if (convWithDept) {
            this.chatGateway.emitConversationUpdated(tenantId, convWithDept);
          }
        }
      }

      // Buscar deal existente associado a este contato no tenant
      const existingDeal = await this.prisma.deal.findFirst({
        where: { tenantId, contactId },
        orderBy: { updatedAt: 'desc' },
        include: { contact: true, assignee: true },
      });

      const currentMeta = (existingDeal?.metadata as Record<string, any>) || {};
      const updatedMeta = {
        ...currentMeta,
        ...(aiResponse.produto_interesse &&
        aiResponse.produto_interesse !== 'Não informado' &&
        aiResponse.produto_interesse !== 'Atendimento Comercial' &&
        aiResponse.produto_interesse !== 'Atendimento Geral'
          ? { model: aiResponse.produto_interesse, product: aiResponse.produto_interesse }
          : {}),
        ...(aiResponse.cidade_uf ? { city: aiResponse.cidade_uf } : {}),
        ...(aiResponse.email_cliente ? { email: aiResponse.email_cliente } : {}),
        ...(aiResponse.empresa_cliente ? { company: aiResponse.empresa_cliente } : {}),
        ...(aiResponse.cargo_cliente ? { role: aiResponse.cargo_cliente } : {}),
        ...(aiResponse.formulario_origem || formName ? { formName: aiResponse.formulario_origem || formName } : {}),
        source: source || conversation.contact.source || currentMeta.source || 'WhatsApp',
      };

      if (existingDeal && !aiResponse.transferir_vendedor) {
        const updatedDeal = await this.prisma.deal.update({
          where: { id: existingDeal.id },
          data: {
            ...(aiResponse.produto_interesse &&
            aiResponse.produto_interesse !== 'Não informado' &&
            aiResponse.produto_interesse !== 'Atendimento Comercial' &&
            (!existingDeal.title ||
              existingDeal.title === 'Atendimento Comercial' ||
              existingDeal.title === 'Novo Lead' ||
              existingDeal.title === existingDeal.contact?.name)
              ? { title: aiResponse.produto_interesse }
              : {}),
            ...(aiResponse.resumo_atendimento ? { notes: aiResponse.resumo_atendimento } : {}),
            metadata: {
              ...updatedMeta,
              ...(resolvedDeptId ? { departmentId: resolvedDeptId } : {}),
              ...(aiResponse.setor_destino ? { sector: aiResponse.setor_destino } : {}),
            },
          },
          include: { contact: true, assignee: true },
        }).catch(() => null);
      }
    } catch (enrichErr: any) {
      this.logger.warn(`Falha não-bloqueante no auto-enriquecimento do Lead pela IA: ${enrichErr.message}`);
    }

    // 5. Analisar Handoff (Transferência)
    if (aiResponse.transferir_vendedor) {
      this.logger.log(`Lead solicitou atendimento humano (Setor: ${aiResponse.setor_destino || 'COMERCIAL'}). Executando protocolo de Transbordo...`);

      // 5.1 Seleção Inteligente de Atendente por Setor/Região (respeitando rigorosamente o departamento da conversa)
      let assignedTo: string | null = null;

      let candidateAgents: { id: string; isOnline: boolean }[] = [];
      if (resolvedDeptId) {
        // Busca primeiro os operadores vinculados especificamente a esta Região / Setor
        const deptAgents = await this.prisma.user.findMany({
          where: {
            tenantId,
            isActive: true,
            departments: {
              some: { departmentId: resolvedDeptId },
            },
          },
          select: { id: true, isOnline: true, role: true },
        });

        // Prioriza operadores do setor que estejam online; se nenhum estiver online no momento, atribui ao titular do setor mesmo offline
        const onlineInDept = deptAgents.filter(a => a.isOnline);
        candidateAgents = onlineInDept.length > 0 ? onlineInDept : deptAgents;
      }

      if (candidateAgents.length === 0 && !resolvedDeptId) {
        candidateAgents = await this.prisma.user.findMany({
          where: { tenantId, isActive: true, isOnline: true },
          select: { id: true, isOnline: true },
        });
      }

      if (candidateAgents.length > 0) {
        let minLoad = Infinity;
        for (const agent of candidateAgents) {
          const activeCount = await this.prisma.conversation.count({
            where: { assignedTo: agent.id, status: { in: ['open', 'human_takeover'] } }
          });
          if (activeCount < minLoad) {
            minLoad = activeCount;
            assignedTo = agent.id;
          }
        }
      }

      // Transfere o atendimento para o consultor humano e silencia a IA
      const updatedConv = await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'open',
          assignedTo,
          ...(resolvedDeptId ? { departmentId: resolvedDeptId } : {}),
        },
        include: {
          contact: true,
          department: { select: { id: true, name: true, color: true } },
        }
      });

      // Emissão em tempo real para o Inbox transferindo para atendimento humano
      this.chatGateway.emitConversationUpdated(tenantId, updatedConv);

      // Emissão do alerta rico de Handoff para o Front-end (isolado por setor e responsável)
      this.chatGateway.server.to(tenantId).emit('aiHandoffAlert', {
        conversationId,
        contactId,
        departmentId: updatedConv.departmentId || resolvedDeptId || null,
        department: updatedConv.department || null,
        assignedTo: updatedConv.assignedTo || assignedTo || null,
        contactName: conversation.contact.name || aiResponse.nome_cliente || 'Lead WhatsApp',
        contactPhone: conversation.contact.phone,
        phone: conversation.contact.phone,
        product: aiResponse.produto_interesse,
        reason: aiResponse.motivo_transferencia,
        summary: aiResponse.resumo_atendimento,
      });

      // 5.2 Atualizar/Criar o Deal no CRM com Metadados Completos
      const existingDealForHandoff = await this.prisma.deal.findFirst({
        where: { tenantId, contactId },
        orderBy: { updatedAt: 'desc' },
      });

      const currentMetaHandoff = (existingDealForHandoff?.metadata as Record<string, any>) || {};
      const fullMeta = {
        ...currentMetaHandoff,
        ...(resolvedDeptId ? { departmentId: resolvedDeptId } : {}),
        ...(aiResponse.setor_destino ? { sector: aiResponse.setor_destino } : {}),
        ...(aiResponse.produto_interesse &&
        aiResponse.produto_interesse !== 'Não informado' &&
        aiResponse.produto_interesse !== 'Atendimento Geral'
          ? { model: aiResponse.produto_interesse, product: aiResponse.produto_interesse }
          : {}),
        ...(aiResponse.cidade_uf ? { city: aiResponse.cidade_uf } : {}),
        ...(aiResponse.email_cliente ? { email: aiResponse.email_cliente } : {}),
        ...(aiResponse.empresa_cliente ? { company: aiResponse.empresa_cliente } : {}),
        ...(aiResponse.cargo_cliente ? { role: aiResponse.cargo_cliente } : {}),
        ...(aiResponse.formulario_origem || formName ? { formName: aiResponse.formulario_origem || formName } : {}),
        source: source || conversation.contact.source || currentMetaHandoff.source || 'WhatsApp',
      };

      let updatedDeal;
      if (existingDealForHandoff) {
        updatedDeal = await this.prisma.deal.update({
          where: { id: existingDealForHandoff.id },
          data: {
            title:
              aiResponse.produto_interesse &&
              aiResponse.produto_interesse !== 'Não informado' &&
              aiResponse.produto_interesse !== 'Atendimento Comercial' &&
              aiResponse.produto_interesse !== 'Atendimento Geral'
                ? aiResponse.produto_interesse
                : existingDealForHandoff.title,
            notes: aiResponse.resumo_atendimento || existingDealForHandoff.notes,
            ...(assignedTo ? { assignedTo } : {}),
            metadata: fullMeta,
          },
          include: { contact: true, assignee: true },
        });
      } else {
        updatedDeal = await this.prisma.deal.create({
          data: {
            tenantId,
            contactId,
            assignedTo: assignedTo || null,
            title:
              aiResponse.produto_interesse &&
              aiResponse.produto_interesse !== 'Não informado' &&
              aiResponse.produto_interesse !== 'Atendimento Geral'
                ? aiResponse.produto_interesse
                : 'Atendimento Comercial',
            value: 0,
            status: 'new', // Kanban vai colocar em "Aguardando" / LEADS SEED
            notes: aiResponse.resumo_atendimento,
            metadata: fullMeta,
          },
          include: { contact: true, assignee: true },
        });
      }

      // Emitir para o front-end (Kanban) com metadados de setor para filtragem de notificações
      this.chatGateway.emitHandoff(tenantId, {
        ...updatedDeal,
        departmentId: resolvedDeptId,
        assignedTo: updatedDeal.assignedTo || assignedTo || null,
      });

      // 5.3 Resolução do telefone real e formatação limpa (eliminando @lid)
      let rawCandidatePhone = aiResponse.telefone_cliente || conversation.contact.phone;

      // Se o telefone do contato for @lid e a IA não pegou outro, tenta achar contato irmão no mesmo tenant que tenha número real
      if (rawCandidatePhone && rawCandidatePhone.includes('@lid')) {
        const siblingContact = await this.prisma.contact.findFirst({
          where: {
            tenantId,
            id: { not: contactId },
            phone: { not: { contains: '@lid' } },
            OR: [
              ...(conversation.contact.name && conversation.contact.name !== 'Cliente WhatsApp'
                ? [{ name: { equals: conversation.contact.name, mode: 'insensitive' as any } }]
                : []),
              ...(conversation.contact.whatsappLid
                ? [{ whatsappLid: conversation.contact.whatsappLid }]
                : [])
            ]
          },
          select: { phone: true }
        });

        if (siblingContact?.phone && !siblingContact.phone.includes('@lid')) {
          rawCandidatePhone = siblingContact.phone;
        }
      }

      const phoneInfo = this.formatCleanPhone(rawCandidatePhone);

      // Montagem do Alerta Corporativo de Lead Qualificado
      let alertMsg = `🚨 *NOVO LEAD QUALIFICADO* 🚨\n\n` +
        `👤 *Cliente:* ${aiResponse.nome_cliente || conversation.contact.name}\n` +
        `📱 *Telefone:* ${phoneInfo.formatted}\n`;

      if (phoneInfo.isRealPhone && phoneInfo.cleanDigits) {
        alertMsg += `🔗 *WhatsApp Direto:* https://wa.me/${phoneInfo.cleanDigits}\n`;
      }

      alertMsg += `🎯 *Interesse:* ${aiResponse.produto_interesse || 'Não especificado'}\n` +
        `📌 *Motivo:* ${aiResponse.motivo_transferencia}\n\n` +
        `📝 *Resumo do Atendimento:*\n${aiResponse.resumo_atendimento}`;

      if (!phoneInfo.isRealPhone) {
        alertMsg += `\n\n💡 *Ação:* Responda diretamente pela central de atendimento (Inbox) no Vallor.`;
      }

      // 5.4 Envio Multi-Tenant do Alerta (para o Gerente Comercial ou Grupo do Tenant)
      const tenant = conversation.contact.tenant;
      const targetRecipient =
        tenant?.leadNotificationPhone ||
        (tenant?.whatsappSettings as any)?.leadNotificationPhone ||
        tenant?.phone;

      if (targetRecipient && String(targetRecipient).trim().length >= 8) {
        this.logger.log(`[Multi-Tenant Alert] Disparando alerta de lead para o responsável [${targetRecipient}] da empresa [${tenant?.name || tenantId}]`);
        await this.messagingService.sendText({
          tenantId,
          phone: targetRecipient.trim(),
          content: alertMsg,
        }).catch((err) => {
          this.logger.error(`[Multi-Tenant Alert] Falha ao disparar alerta de lead para ${targetRecipient}: ${err.message}`);
        });
      } else {
        this.logger.warn(`[Multi-Tenant Alert] Empresa [${tenant?.name || tenantId}] não possui WhatsApp de Notificação de Leads configurado. O alerta foi registrado no Kanban e Inbox.`);
      }

      return { status: 'human_takeover_executed' };
    }

    return { status: 'success' };
  }

  /**
   * Sanitiza e formata o telefone para o padrão corporativo nacional/internacional,
   * eliminando identificadores privados (@lid) do alerta do vendedor.
   */
  private formatCleanPhone(rawPhone?: string | null): { formatted: string; isRealPhone: boolean; cleanDigits: string } {
    if (!rawPhone) return { formatted: 'Não informado', isRealPhone: false, cleanDigits: '' };

    const cleanJid = rawPhone.replace('@s.whatsapp.net', '').replace('@c.us', '').trim();

    if (cleanJid.includes('@lid')) {
      return { formatted: 'WhatsApp Privado (Iniciado via Comunidade/Canal)', isRealPhone: false, cleanDigits: '' };
    }

    const digits = cleanJid.replace(/\D/g, '');
    if (!digits || digits.length < 8) {
      return { formatted: rawPhone, isRealPhone: false, cleanDigits: digits };
    }

    // Brasil: 13 dígitos (55 + DDD 2 dígitos + 9 dígitos celular)
    if (digits.length === 13 && digits.startsWith('55')) {
      const ddd = digits.slice(2, 4);
      const p1 = digits.slice(4, 9);
      const p2 = digits.slice(9);
      return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: digits };
    }

    // Brasil: 12 dígitos (55 + DDD 2 dígitos + 8 dígitos fixo/antigo)
    if (digits.length === 12 && digits.startsWith('55')) {
      const ddd = digits.slice(2, 4);
      const p1 = digits.slice(4, 8);
      const p2 = digits.slice(8);
      return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: digits };
    }

    // 11 dígitos (DDD 2 dígitos + 9 dígitos)
    if (digits.length === 11) {
      const ddd = digits.slice(0, 2);
      const p1 = digits.slice(2, 7);
      const p2 = digits.slice(7);
      return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: `55${digits}` };
    }

    // 10 dígitos (DDD 2 dígitos + 8 dígitos)
    if (digits.length === 10) {
      const ddd = digits.slice(0, 2);
      const p1 = digits.slice(2, 6);
      const p2 = digits.slice(6);
      return { formatted: `+55 (${ddd}) ${p1}-${p2}`, isRealPhone: true, cleanDigits: `55${digits}` };
    }

    return { formatted: `+${digits}`, isRealPhone: true, cleanDigits: digits };
  }

  /**
   * Resolve departamentos especializados (Pós-Venda, Financeiro, Recrutamento, Compras) quando classificados pela IA
   */
  private async resolveSpecializedDepartment(tenantId: string, sector: string): Promise<string | null> {
    try {
      const departments = await this.prisma.department.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      });
      if (!departments || departments.length === 0) return null;

      const normalize = (str: string) =>
        str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

      if (sector === 'POS_VENDA') {
        const match = departments.find(d => {
          const n = normalize(d.name);
          return n.includes('POS-VENDA') || n.includes('POS VENDA') || n.includes('ASSISTENCIA') || n.includes('SUPORTE');
        });
        if (match) return match.id;
      } else if (sector === 'FINANCEIRO') {
        const match = departments.find(d => {
          const n = normalize(d.name);
          return n.includes('FINANCEIRO') || n.includes('FATURAMENTO') || n.includes('COBRANCA');
        });
        if (match) return match.id;
      } else if (sector === 'RECRUTAMENTO') {
        const match = departments.find(d => {
          const n = normalize(d.name);
          return n.includes('RECRUTAMENTO') || n.includes('RH') || n.includes('RECURSOS HUMANOS');
        });
        if (match) return match.id;
      } else if (sector === 'COMPRAS') {
        const match = departments.find(d => {
          const n = normalize(d.name);
          return n.includes('COMPRAS') || n.includes('SUPRIMENTOS');
        });
        if (match) return match.id;
      }
    } catch (e: any) {
      this.logger.warn(`Erro ao resolver setor especializado [${sector}]: ${e.message}`);
    }
    return null;
  }

  /**
   * Identifica e resolve a Região/Departamento de forma inteligente (DDD, UF ou nova Região criada)
   */
  private async resolveDepartmentSmart(tenantId: string, phone?: string | null, state?: string | null): Promise<string | null> {
    if (!phone && !state) return null;
    try {
      const departments = await this.prisma.department.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      });
      if (!departments || departments.length === 0) return null;

      const dddToUf: Record<string, string> = {
        '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
        '47': 'SC', '48': 'SC', '49': 'SC',
        '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
        '67': 'MS', '65': 'MT', '66': 'MT',
        '91': 'PA', '93': 'PA', '94': 'PA', '69': 'RO', '95': 'RR', '68': 'AC', '92': 'AM', '97': 'AM', '96': 'AP',
        '62': 'GO', '64': 'GO', '61': 'DF',
        '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
        '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
        '21': 'RJ', '22': 'RJ', '24': 'RJ', '27': 'ES', '28': 'ES',
        '63': 'TO', '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
        '98': 'MA', '99': 'MA', '86': 'PI', '89': 'PI',
        '85': 'CE', '88': 'CE', '84': 'RN', '83': 'PB', '79': 'SE', '81': 'PE', '87': 'PE', '82': 'AL'
      };

      const ufToRegion: Record<string, number> = {
        'RS': 1, 'SC': 1, 'PR': 1,
        'MS': 2, 'MT': 2, 'PA': 2, 'RO': 2, 'RR': 2, 'AC': 2, 'AM': 2, 'AP': 2,
        'GO': 3, 'MG': 3, 'SP': 3, 'DF': 3, 'RJ': 3, 'ES': 3,
        'TO': 4, 'BA': 4,
        'MA': 5, 'PI': 5,
        'CE': 6, 'RN': 6, 'PB': 6, 'SE': 6, 'PE': 6, 'AL': 6
      };

      let uf = state ? state.trim().toUpperCase() : '';
      if (!uf && phone && !phone.includes('@lid')) {
        const clean = phone.replace(/\D/g, '');
        let ddd = '';
        if (clean.startsWith('55') && clean.length >= 12) ddd = clean.substring(2, 4);
        else if (clean.length === 10 || clean.length === 11) ddd = clean.substring(0, 2);
        if (ddd && dddToUf[ddd]) uf = dddToUf[ddd];
        else if (clean.startsWith('595')) uf = 'RS';
      }
      if (!uf) return null;

      // 1. Verifica se algum departamento menciona explicitamente a UF (funciona para novas regiões criadas!)
      const byToken = departments.find(d => new RegExp(`(^|[^A-ZÀ-Ú])${uf}([^A-ZÀ-Ú]|$)`).test(d.name.toUpperCase()));
      if (byToken) return byToken.id;

      // 2. Fallback para numeração oficial REGIÃO 1..6
      const targetRegionNum = ufToRegion[uf];
      if (targetRegionNum) {
        const matched = departments.find(d => {
          const upper = d.name.toUpperCase();
          return upper.includes(`REGIÃO ${targetRegionNum}`) || upper.includes(`REGIAO ${targetRegionNum}`);
        });
        if (matched) return matched.id;
      }
    } catch (e: any) {
      this.logger.warn(`Erro ao resolver departamento pela IA: ${e.message}`);
    }
    return null;
  }
}
