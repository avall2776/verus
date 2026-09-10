import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
@Module({
  imports: [
    ConfigModule,
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
