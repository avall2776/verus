"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./shared/database/database.module");
const auth_module_1 = require("./modules/auth/auth.module");
const queue_module_1 = require("./modules/queues/queue.module");
const webhooks_module_1 = require("./modules/webhooks/webhooks.module");
const messaging_module_1 = require("./modules/messaging/messaging.module");
const ai_module_1 = require("./modules/ai/ai.module");
const chat_module_1 = require("./modules/chat/chat.module");
const crm_module_1 = require("./modules/crm/crm.module");
const agent_module_1 = require("./modules/agent/agent.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const contacts_module_1 = require("./modules/contacts/contacts.module");
const rag_module_1 = require("./modules/rag/rag.module");
const departments_module_1 = require("./modules/departments/departments.module");
const quick_replies_module_1 = require("./modules/quick-replies/quick-replies.module");
const automations_module_1 = require("./modules/automations/automations.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const monitor_module_1 = require("./modules/monitor/monitor.module");
const team_chat_module_1 = require("./modules/team-chat/team-chat.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const storage_module_1 = require("./shared/storage/storage.module");
const proposals_module_1 = require("./modules/proposals/proposals.module");
const goals_module_1 = require("./modules/goals/goals.module");
const contracts_module_1 = require("./modules/contracts/contracts.module");
const emails_module_1 = require("./modules/emails/emails.module");
const support_module_1 = require("./modules/support/support.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
const workspaces_module_1 = require("./modules/workspaces/workspaces.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const search_module_1 = require("./modules/search/search.module");
const operators_module_1 = require("./modules/operators/operators.module");
const engineering_module_1 = require("./modules/engineering/engineering.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            storage_module_1.StorageModule,
            auth_module_1.AuthModule,
            queue_module_1.QueueModule,
            webhooks_module_1.WebhooksModule,
            messaging_module_1.MessagingModule,
            ai_module_1.AiModule,
            chat_module_1.ChatModule,
            crm_module_1.CrmModule,
            agent_module_1.AgentModule,
            dashboard_module_1.DashboardModule,
            contacts_module_1.ContactsModule,
            rag_module_1.RagModule,
            departments_module_1.DepartmentsModule,
            quick_replies_module_1.QuickRepliesModule,
            automations_module_1.AutomationsModule,
            whatsapp_module_1.WhatsappModule,
            monitor_module_1.MonitorModule,
            team_chat_module_1.TeamChatModule,
            analytics_module_1.AnalyticsModule,
            proposals_module_1.ProposalsModule,
            goals_module_1.GoalsModule,
            contracts_module_1.ContractsModule,
            emails_module_1.EmailsModule,
            support_module_1.SupportModule,
            tenants_module_1.TenantsModule,
            workspaces_module_1.WorkspacesModule,
            notifications_module_1.NotificationsModule,
            search_module_1.SearchModule,
            operators_module_1.OperatorsModule,
            engineering_module_1.EngineeringModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map