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
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { RagModule } from './modules/rag/rag.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { QuickRepliesModule } from './modules/quick-replies/quick-replies.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { MonitorModule } from './modules/monitor/monitor.module';

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
    DashboardModule,
    ContactsModule,
    RagModule,
    DepartmentsModule,
    QuickRepliesModule,
    AutomationsModule,
    WhatsappModule,
    MonitorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
