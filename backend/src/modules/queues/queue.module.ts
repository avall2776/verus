import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { WebhookProcessor } from './processors/webhook.processor';
import { AiProcessor } from './processors/ai.processor';
import { DatabaseModule } from '../../shared/database/database.module';
import { AiModule } from '../ai/ai.module';
import { MessagingModule } from '../messaging/messaging.module';
import { ChatModule } from '../chat/chat.module'; // Importa o ChatModule para usar o Gateway
import { AutomationsProcessor } from './processors/automations.processor';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    AiModule,
    MessagingModule,
    ChatModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
    BullModule.registerQueue({ name: 'webhook-ingress' }),
    BullModule.registerQueue({ name: 'ai-processing' }),
    BullModule.registerQueue({ name: 'automations' }),
    AutomationsModule,
  ],
  providers: [WebhookProcessor, AiProcessor, AutomationsProcessor],
  exports: [BullModule],
})
export class QueueModule {}
