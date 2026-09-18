import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotDetectorMiddleware } from './shared/middlewares/bot-detector.middleware';
import { RateLimiterMiddleware } from './shared/middlewares/rate-limiter.middleware';
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
import { TeamChatModule } from './modules/team-chat/team-chat.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { StorageModule } from './shared/storage/storage.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { EmailsModule } from './modules/emails/emails.module';
import { SupportModule } from './modules/support/support.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { EngineeringModule } from './modules/engineering/engineering.module';
import { VoipModule } from './modules/voip/voip.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    StorageModule,
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
    TeamChatModule,
    AnalyticsModule,
    ProposalsModule,
    GoalsModule,
    ContractsModule,
    EmailsModule,
    SupportModule,
    TenantsModule,
    WorkspacesModule,
    NotificationsModule,
    SearchModule,
    OperatorsModule,
    EngineeringModule,
    VoipModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BotDetectorMiddleware, RateLimiterMiddleware)
      .forRoutes('*');
  }
}

