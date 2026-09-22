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
    const { tenantId, conversationId, contactId } = job.data;
    
    this.logger.debug(`Iniciando orquestração de IA para a conversa [${conversationId}]`);

    // 1. A REGRA DE OURO (Trava Handoff)
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: { include: { tenant: true } } }
    });

    if (!conversation) {
      throw new Error(`Conversa ${conversationId} não encontrada.`);
    }

    if (conversation.status !== 'bot_active') {
      this.logger.warn(`Conversa [${conversationId}] está com status '${conversation.status}'. IA Abortada.`);
      return { status: 'aborted', reason: 'Not bot_active' };
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

    // 4. Despachar a resposta para o Lead
    if (aiResponse.resposta_cliente) {
      // O MessagingService se encarrega de disparar via driver compatível (Evolution API ou Meta API)
      const sendRes = await this.messagingService.sendText({
        tenantId,
        phone: conversation.contact.phone,
        content: aiResponse.resposta_cliente
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
          content: aiResponse.resposta_cliente,
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

    // 5. Analisar Handoff (Transferência)
    if (aiResponse.transferir_vendedor) {
      this.logger.log(`Lead solicitou atendimento humano. Executando protocolo de Transbordo...`);

      // 5.1 Round-Robin: Buscar atendente online com menor carga
      let assignedTo = null;
      
      const onlineAgents = await this.prisma.user.findMany({
        where: { tenantId, isOnline: true }
      });

      if (onlineAgents.length > 0) {
        let minLoad = Infinity;
        for (const agent of onlineAgents) {
          const activeCount = await this.prisma.conversation.count({
            where: { assignedTo: agent.id, status: { in: ['open', 'human_takeover'] } }
          });
          if (activeCount < minLoad) {
            minLoad = activeCount;
            assignedTo = agent.id;
          }
        }
      }

      // Atualizar status da conversa (Trava Handoff) com o atendente sorteado
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'human_takeover', assignedTo }
      });

      // 5.2 Atualizar/Criar o Deal no CRM
      const dealData = {
        tenantId,
        contactId,
        title: aiResponse.produto_interesse || 'Atendimento Comercial',
        value: 0,
        status: 'new', // Kanban vai colocar em "Aguardando"
        notes: aiResponse.resumo_atendimento,
      };

      const updatedDeal = await this.prisma.deal.upsert({
        where: { id: `deal_${conversationId}` } as any, // Mock simples para o id único por contato/conversa
        create: dealData,
        update: dealData
      }).catch(async () => {
         return await this.prisma.deal.create({ data: dealData });
      });

      // Emitir para o front-end (Kanban)
      this.chatGateway.emitHandoff(tenantId, updatedDeal);

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
        alertMsg += `\n\n💡 *Ação:* Responda diretamente pela central de atendimento (Inbox) no VERSUS.`;
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
}
