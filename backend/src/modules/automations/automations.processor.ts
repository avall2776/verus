import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Processor('automations')
export class AutomationsProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationsProcessor.name);

  constructor(
    private readonly automationsService: AutomationsService,
    private readonly prisma: PrismaService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processando job: ${job.name} (ID: ${job.id})`);
    
    if (job.name === 'processInactivity') {
      const { tenantId, automationId, contactId, eventData } = job.data;
      
      const automation = await this.prisma.automation.findUnique({ where: { id: automationId } });
      if (!automation || !automation.isActive) {
        this.logger.log(`Automação inativa ou deletada, abortando job.`);
        return;
      }

      // Check if contact replied (if updatedAt is > triggeredAt, or similar check)
      const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
      if (!contact) return;
      
      const conv = await this.prisma.conversation.findUnique({
        where: { tenantId_contactId: { tenantId, contactId } }
      });
      
      if (conv) {
        const triggeredDate = new Date(eventData.triggeredAt);
        // If the conversation was updated (e.g. by a new message) after the trigger was scheduled, it's not inactive anymore
        if (conv.updatedAt > triggeredDate) {
          this.logger.log(`Lead respondeu ou teve movimentação, inatividade cancelada para ${contactId}.`);
          return;
        }
      }

      this.logger.log(`Tempo limite de inatividade atingido. Executando ação para ${contactId}...`);
      await this.automationsService.executeAction(automation, eventData);
    }
  }
}
