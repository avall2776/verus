import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AutomationsService } from '../../automations/automations.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@Processor('automations')
export class AutomationsProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processando job de automação: ${job.name} (ID: ${job.id})`);
    
    const { tenantId, automationId, contactId, eventData } = job.data;

    try {
      const automation = await this.prisma.automation.findUnique({
        where: { id: automationId }
      });

      if (!automation || !automation.isActive) {
        this.logger.log(`Automação ${automationId} inativa ou não encontrada. Abortando.`);
        return;
      }

      // IMPORTANTE: Para gatilhos como Inatividade, precisamos checar se o contato interagiu depois de agendado
      if (automation.triggerType === 'INACTIVITY') {
        const contact = await this.prisma.contact.findUnique({ where: { id: contactId }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } } });
        
        // Se a ultima mensagem do contato for MAIS RECENTE que o timestamp do job, abortamos
        if (contact && contact.messages.length > 0) {
          const lastMsg = contact.messages[0];
          // eventData.triggeredAt tem que ser passado na criação do job
          if (lastMsg.direction === 'INBOUND' && eventData.triggeredAt && new Date(lastMsg.createdAt) > new Date(eventData.triggeredAt)) {
             this.logger.log(`Lead respondeu antes do timeout. Automação Inatividade cancelada.`);
             return;
          }
        }
      }

      // Executa a ação diretamente no Service (que fará a auditoria no AutomationLog)
      await this.automationsService.executeAction(automation, { ...eventData, contactId });

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Erro ao processar automação: ${error.message}`, error.stack);
      throw error;
    }
  }
}
