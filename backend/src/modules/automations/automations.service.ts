import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
    @InjectQueue('automations') private readonly automationsQueue: Queue
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.automation.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { logs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(tenantId: string, id: string) {
    const auto = await this.prisma.automation.findUnique({
      where: { id },
      include: {
        logs: {
          take: 20,
          orderBy: { executedAt: 'desc' }
        }
      }
    });
    if (!auto || auto.tenantId !== tenantId) {
      throw new NotFoundException('Automação não encontrada');
    }
    return auto;
  }

  async create(tenantId: string, data: CreateAutomationDto) {
    // Normalizar condições e ações para manter compatibilidade com colunas Json novas e legadas
    const triggerConditions = data.triggerConditions || data.conditions || {};
    const actionType = data.actionType || (data.actions && data.actions[0]?.type) || 'SEND_WHATSAPP';
    const actionPayload = data.actionPayload || (data.actions && data.actions[0]) || {};
    const actions = data.actions || [{ type: actionType, ...actionPayload }];

    return this.prisma.automation.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description || null,
        triggerType: data.triggerType,
        triggerConditions,
        conditions: triggerConditions,
        actionType,
        actionPayload,
        actions,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  async update(tenantId: string, id: string, data: UpdateAutomationDto) {
    const auto = await this.prisma.automation.findUnique({ where: { id } });
    if (!auto || auto.tenantId !== tenantId) throw new NotFoundException('Automação não encontrada');

    const updateData: any = { ...data };

    if (data.triggerConditions !== undefined || data.conditions !== undefined) {
      const cond = data.triggerConditions || data.conditions || {};
      updateData.triggerConditions = cond;
      updateData.conditions = cond;
    }

    if (data.actionType !== undefined || data.actionPayload !== undefined) {
      const aType = data.actionType || auto.actionType;
      const aPayload = data.actionPayload !== undefined ? data.actionPayload : auto.actionPayload;
      updateData.actionType = aType;
      updateData.actionPayload = aPayload;
      updateData.actions = [{ type: aType, ...(typeof aPayload === 'object' ? aPayload : {}) }];
    }

    return this.prisma.automation.update({
      where: { id },
      data: updateData
    });
  }

  async remove(tenantId: string, id: string) {
    const auto = await this.prisma.automation.findUnique({ where: { id } });
    if (!auto || auto.tenantId !== tenantId) throw new NotFoundException('Automação não encontrada');

    return this.prisma.automation.delete({ where: { id } });
  }

  async getLogs(tenantId: string) {
    return this.prisma.automationLog.findMany({
      where: { tenantId },
      include: {
        automation: {
          select: {
            id: true,
            name: true,
            triggerType: true,
            actionType: true
          }
        },
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 100
    });
  }

  /**
   * Dispara um teste manual simulado da automação
   */
  async testAutomation(tenantId: string, id: string) {
    const auto = await this.prisma.automation.findUnique({ where: { id } });
    if (!auto || auto.tenantId !== tenantId) {
      throw new NotFoundException('Automação não encontrada');
    }

    // Mock contextual para teste
    const mockContext: Record<string, any> = {
      clientName: 'Dr. Roberto Santos',
      cliente: 'Dr. Roberto Santos',
      nome: 'Dr. Roberto Santos',
      proposalCode: 'PROP-8821',
      proposta: 'PROP-8821',
      dealTitle: 'Implementação Enterprise VERSUS',
      titulo: 'Implementação Enterprise VERSUS',
      value: 'R$ 15.000,00',
      valor: 'R$ 15.000,00',
      phone: '+55 11 98765-4321',
      telefone: '+55 11 98765-4321',
      companyName: 'Santos & Associados',
      empresa: 'Santos & Associados',
      userEmail: 'comercial@versus.io',
      vendedor: 'comercial@versus.io'
    };

    const actionType = auto.actionType || (auto.actions as any)?.[0]?.type || 'SEND_WHATSAPP';
    const actionPayload: any = auto.actionPayload || (auto.actions as any)?.[0] || {};
    
    let resolvedMessage = '';
    if (actionPayload.message) {
      resolvedMessage = this.interpolateVariables(actionPayload.message, mockContext);
    }

    const payloadDetails = {
      type: 'MANUAL_TEST_EXECUTION',
      simulated: true,
      triggerType: auto.triggerType,
      actionType,
      actionPayload,
      resolvedMessage: resolvedMessage || undefined,
      mockContext,
      executedAt: new Date().toISOString()
    };

    // Registrar o log de sucesso do teste manual
    const log = await this.prisma.automationLog.create({
      data: {
        tenantId,
        automationId: auto.id,
        status: 'SUCCESS',
        payloadDetails,
        executedAt: new Date()
      }
    });

    this.logger.log(`Teste manual da automação ${auto.id} concluído com sucesso (Log: ${log.id}).`);

    return {
      success: true,
      message: `Automação "${auto.name}" disparada e validada com sucesso!`,
      logId: log.id,
      actionType,
      resolvedMessage,
      executedAt: log.executedAt
    };
  }

  /**
   * Interpola variáveis dinâmicas no padrão {{variavel}}
   */
  interpolateVariables(template: string, context: Record<string, any>): string {
    if (!template) return '';
    return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      const lowerKey = key.toLowerCase();
      if (context[key] !== undefined && context[key] !== null) {
        return String(context[key]);
      }
      // Busca case-insensitive
      const foundEntry = Object.entries(context).find(([k]) => k.toLowerCase() === lowerKey);
      if (foundEntry && foundEntry[1] !== undefined && foundEntry[1] !== null) {
        return String(foundEntry[1]);
      }
      return match;
    });
  }

  async evaluateEvent(tenantId: string, triggerType: string, eventData: any) {
    const automations = await this.prisma.automation.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { triggerType },
          ...(triggerType === 'STAGE_CHANGED' ? [{ triggerType: 'DEAL_STAGE_CHANGED' }] : []),
          ...(triggerType === 'DEAL_STAGE_CHANGED' ? [{ triggerType: 'STAGE_CHANGED' }] : []),
          ...(triggerType === 'INACTIVITY' ? [{ triggerType: 'INACTIVITY_TIMEOUT' }] : []),
          ...(triggerType === 'INACTIVITY_TIMEOUT' ? [{ triggerType: 'INACTIVITY' }] : [])
        ]
      }
    });

    if (!automations.length) return;

    for (const automation of automations) {
      let conditionMet = true;
      const conditions: any = automation.triggerConditions || automation.conditions || {};

      if (conditions.tag && eventData.tag && eventData.tag !== conditions.tag) {
        conditionMet = false;
      }
      
      if (conditions.stage && eventData.stage && eventData.stage !== conditions.stage) {
        conditionMet = false;
      }

      if (conditions.minValue && eventData.value && Number(eventData.value) < Number(conditions.minValue)) {
        conditionMet = false;
      }

      if (!conditionMet) continue;

      if (triggerType === 'INACTIVITY' || triggerType === 'INACTIVITY_TIMEOUT') {
        const timeoutMinutes = conditions.timeoutMinutes || 60;
        await this.automationsQueue.add('processInactivity', {
          tenantId,
          automationId: automation.id,
          contactId: eventData.contactId,
          eventData: { ...eventData, triggeredAt: new Date().toISOString() }
        }, {
          delay: timeoutMinutes * 60 * 1000,
          jobId: `inactivity_${automation.id}_${eventData.contactId}`
        });
        this.logger.log(`Agendado INACTIVITY ${automation.id} para contato ${eventData.contactId} em ${timeoutMinutes}min`);
      } else {
        await this.executeAction(automation, eventData);
      }
    }
  }

  async executeAction(automation: any, eventData: any) {
    const cid = eventData.contactId;
    let contact = null;
    if (cid) {
      contact = await this.prisma.contact.findUnique({ where: { id: cid } });
    }

    let success = true;
    let errorMsg = '';
    const executionDetails: any = {
      eventData,
      actionsExecuted: []
    };

    try {
      const actionType = automation.actionType || (automation.actions as any)?.[0]?.type;
      const actionPayload = automation.actionPayload || (automation.actions as any)?.[0] || {};
      const actionsList = (automation.actions && (automation.actions as any[]).length > 0)
        ? (automation.actions as any[])
        : [{ type: actionType, ...actionPayload }];

      // Montar contexto dinâmico de interpolação
      const context: Record<string, any> = {
        clientName: contact?.name || eventData.clientName || 'Cliente',
        cliente: contact?.name || eventData.clientName || 'Cliente',
        nome: contact?.name || eventData.clientName || 'Cliente',
        phone: contact?.phone || eventData.phone || '',
        telefone: contact?.phone || eventData.phone || '',
        proposalCode: eventData.proposalCode || eventData.code || '',
        proposta: eventData.proposalCode || eventData.code || '',
        dealTitle: eventData.dealTitle || eventData.title || '',
        titulo: eventData.dealTitle || eventData.title || '',
        value: eventData.value ? `R$ ${Number(eventData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
        valor: eventData.value ? `R$ ${Number(eventData.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '',
        userEmail: eventData.userEmail || '',
        vendedor: eventData.userName || eventData.userEmail || '',
        companyName: eventData.companyName || ''
      };

      for (const act of actionsList) {
        if (act.type === 'SEND_MESSAGE' || act.type === 'SEND_WHATSAPP') {
          const rawMessage = act.message || act.content || '';
          const finalMsg = this.interpolateVariables(rawMessage, context);
          
          if (contact?.phone) {
            await this.messagingService.sendText({
              tenantId: automation.tenantId,
              phone: contact.phone,
              content: finalMsg
            });
            
            await this.prisma.message.create({
              data: {
                tenantId: automation.tenantId,
                conversationId: eventData.conversationId || (await this.getOrCreateConversation(automation.tenantId, cid)).id,
                contactId: cid,
                content: finalMsg,
                direction: 'OUTBOUND',
                senderType: 'system',
                status: 'sent'
              }
            });
          }

          executionDetails.actionsExecuted.push({
            type: act.type,
            recipient: contact?.phone || 'N/A',
            resolvedMessage: finalMsg
          });
        }

        if (act.type === 'ADD_TAG') {
          const tag = act.tag;
          if (tag && cid && contact) {
            const currentTags = (contact.tags as string[]) || [];
            if (!currentTags.includes(tag)) {
              await this.prisma.contact.update({
                where: { id: cid },
                data: { tags: [...currentTags, tag] }
              });
            }
          }
          executionDetails.actionsExecuted.push({ type: 'ADD_TAG', tag });
        }

        if (act.type === 'TRANSFER') {
          const departmentId = act.departmentId;
          if (cid) {
            const conv = await this.getOrCreateConversation(automation.tenantId, cid);
            if (departmentId && conv) {
              await this.prisma.conversation.update({
                where: { id: conv.id },
                data: { departmentId, status: 'waiting', assignedTo: null }
              });
            }
          }
          executionDetails.actionsExecuted.push({ type: 'TRANSFER', departmentId });
        }

        if (act.type === 'MOVE_STAGE' || act.type === 'UPDATE_DEAL_STAGE') {
          const stage = act.stage || act.targetStage;
          if (stage) {
            let dealId = eventData.dealId;
            if (!dealId && cid) {
              const deal = await this.prisma.deal.findFirst({
                where: { contactId: cid, tenantId: automation.tenantId },
                orderBy: { createdAt: 'desc' }
              });
              if (deal) dealId = deal.id;
            }
            if (dealId) {
              await this.prisma.deal.update({ where: { id: dealId }, data: { status: stage } });
            }
          }
          executionDetails.actionsExecuted.push({ type: act.type, stage });
        }
      }
    } catch (e: any) {
      success = false;
      errorMsg = e.message;
      this.logger.error(`Erro ao executar ações da automação ${automation.id}: ${e.message}`);
    }

    // Gravar log detalhado no banco de dados
    await this.prisma.automationLog.create({
      data: {
        tenantId: automation.tenantId,
        automationId: automation.id,
        contactId: cid || null,
        dealId: eventData.dealId || null,
        status: success ? 'SUCCESS' : 'FAILED',
        payloadDetails: executionDetails,
        errorReason: errorMsg || null,
        error: errorMsg || null,
        executedAt: new Date()
      }
    });
  }

  private async getOrCreateConversation(tenantId: string, contactId: string) {
    let conv = await this.prisma.conversation.findUnique({
      where: { tenantId_contactId: { tenantId, contactId } }
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { tenantId, contactId, status: 'bot_active' }
      });
    }
    return conv;
  }
}
