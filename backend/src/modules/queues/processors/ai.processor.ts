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
  private readonly CENTRAL_COMERCIAL = '+5554999974220'; // Diretriz do plano

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

    // 2. Extrair Contexto (Últimas 15 mensagens, ordenadas da mais antiga para a mais nova)
    const historyDb = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const historyForAi: { role: 'user'|'assistant', content: string }[] = historyDb
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
      // O MessagingService se encarrega de disparar via axios para a Evolution API
      await this.messagingService.sendText({
        tenantId,
        phone: conversation.contact.phone,
        content: aiResponse.resposta_cliente
      });

      // Salva a nossa própria resposta no banco como system/delivered
      const savedMsg = await this.prisma.message.create({
        data: {
          tenantId,
          conversationId,
          contactId,
          providerMessageId: `out_${Date.now()}`, // ID temporário ou retornado da API
          content: aiResponse.resposta_cliente,
          direction: 'OUTBOUND',
          senderType: 'system',
          status: 'delivered', 
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

      // 5.3 Enviar alerta de transbordo para a central comercial
      const alertMsg = `🚨 *NOVO LEAD QUALIFICADO* 🚨\n\n*Cliente:* ${aiResponse.nome_cliente || conversation.contact.name}\n*Telefone:* ${conversation.contact.phone}\n*Interesse:* ${aiResponse.produto_interesse || 'Não especificado'}\n*Motivo:* ${aiResponse.motivo_transferencia}\n\n*Resumo:* ${aiResponse.resumo_atendimento}`;
      
      await this.messagingService.sendText({
        tenantId,
        phone: this.CENTRAL_COMERCIAL,
        content: alertMsg,
      });

      return { status: 'human_takeover_executed' };
    }

    return { status: 'success' };
  }
}
