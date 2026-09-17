import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { DatabaseModule } from '../../shared/database/database.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ChatModule,
    BullModule.registerQueue({
      name: 'webhook-ingress',
    }),
    BullModule.registerQueue({
      name: 'ai-processing',
    }),
  ],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
