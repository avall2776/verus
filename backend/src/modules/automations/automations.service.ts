import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

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
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.automation.create({
      data: {
        tenantId,
        name: data.name,
        triggerType: data.triggerType,
        conditions: data.conditions,
        actionType: data.actionType,
        actionData: data.actionData,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const auto = await this.prisma.automation.findUnique({ where: { id } });
    if (!auto || auto.tenantId !== tenantId) throw new NotFoundException('Automação não encontrada');

    return this.prisma.automation.update({
      where: { id },
      data
    });
  }

  async remove(tenantId: string, id: string) {
    const auto = await this.prisma.automation.findUnique({ where: { id } });
    if (!auto || auto.tenantId !== tenantId) throw new NotFoundException('Automação não encontrada');

    return this.prisma.automation.delete({ where: { id } });
  }

  async evaluateEvent(tenantId: string, triggerType: string, eventData: any) {
    const automations = await this.prisma.automation.findMany({
      where: { tenantId, triggerType, isActive: true }
    });

    if (!automations.length) return;

    for (const automation of automations) {
      let conditionMet = true;
      const conditions: any = automation.conditions || {};

      if (triggerType === 'TAG_ADDED' && conditions.tag) {
        if (eventData.tag !== conditions.tag) conditionMet = false;
      }
      
      if (triggerType === 'STAGE_CHANGED' && conditions.stage) {
        if (eventData.stage !== conditions.stage) conditionMet = false;
      }

      if (!conditionMet) continue;

      if (eventData.contactId) {
        const log = await this.prisma.automationLog.findFirst({
          where: {
            automationId: automation.id,
            contactId: eventData.contactId
          }
        });
        if (log) {
          this.logger.debug(`Automação ${automation.id} já disparou para contato ${eventData.contactId}`);
          continue; 
        }
      }

      if (triggerType === 'INACTIVITY') {
        const timeoutMinutes = conditions.timeoutMinutes || 60;
        await this.automationsQueue.add('processInactivity', {
          tenantId,
          automationId: automation.id,
          contactId: eventData.contactId,
          eventData: { ...eventData, triggeredAt: new Date().toISOString() }
        }, {
          delay: timeoutMinutes * 60 * 1000,
          jobId: `inactivity_${automation.id}_${eventData.contactId}` // Idempotencia de agendamento
        });
        this.logger.log(`Agendado INACTIVITY ${automation.id} para contato ${eventData.contactId} em ${timeoutMinutes}min`);
      } else {
        await this.executeAction(automation, eventData);
      }
    }
  }

  async executeAction(automation: any, eventData: any) {
    if (eventData.contactId) {
      await this.prisma.automationLog.create({
        data: {
          tenantId: automation.tenantId,
          automationId: automation.id,
          contactId: eventData.contactId
        }
      });
    }

    const { actionType, actionData } = automation;
    const { contactId, tenantId } = automation; 
    const cid = eventData.contactId;

    if (!cid) return;
    const contact = await this.prisma.contact.findUnique({ where: { id: cid } });
    if (!contact) return;

    try {
      if (actionType === 'SEND_MESSAGE') {
        const messageTpl = (actionData as any).message || '';
        const finalMsg = messageTpl.replace('{{nome}}', contact.name);
        
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

      if (actionType === 'ADD_TAG') {
        const tag = (actionData as any).tag;
        if (tag) {
          const currentTags = (contact.tags as string[]) || [];
          if (!currentTags.includes(tag)) {
            await this.prisma.contact.update({
              where: { id: cid },
              data: { tags: [...currentTags, tag] }
            });
          }
        }
      }

      if (actionType === 'TRANSFER') {
        const departmentId = (actionData as any).departmentId;
        const conv = await this.getOrCreateConversation(automation.tenantId, cid);
        if (departmentId && conv) {
          await this.prisma.conversation.update({
            where: { id: conv.id },
            data: { departmentId, status: 'waiting', assignedTo: null }
          });
        }
      }

      if (actionType === 'MOVE_STAGE') {
        const stage = (actionData as any).stage;
        if (stage) {
           const deal = await this.prisma.deal.findFirst({ where: { contactId: cid, tenantId: automation.tenantId }, orderBy: { createdAt: 'desc' } });
           if (deal) {
             await this.prisma.deal.update({ where: { id: deal.id }, data: { status: stage } });
           }
        }
      }

    } catch (e) {
      this.logger.error(`Erro ao executar ação ${actionType} na automação ${automation.id}: ${e.message}`);
    }
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
