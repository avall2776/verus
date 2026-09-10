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
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
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
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map