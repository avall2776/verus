import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { QueueModule } from './modules/queues/queue.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { AiModule } from './modules/ai/ai.module';
import { ChatModule } from './modules/chat/chat.module';
import { CrmModule } from './modules/crm/crm.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    QueueModule,
    WebhooksModule,
    MessagingModule,
    AiModule,
    ChatModule,
    CrmModule,
    AgentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
