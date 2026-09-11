"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const webhook_processor_1 = require("./processors/webhook.processor");
const ai_processor_1 = require("./processors/ai.processor");
const database_module_1 = require("../../shared/database/database.module");
const ai_module_1 = require("../ai/ai.module");
const messaging_module_1 = require("../messaging/messaging.module");
const chat_module_1 = require("../chat/chat.module");
const automations_processor_1 = require("./processors/automations.processor");
const automations_module_1 = require("../automations/automations.module");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            database_module_1.DatabaseModule,
            ai_module_1.AiModule,
            messaging_module_1.MessagingModule,
            chat_module_1.ChatModule,
            bullmq_1.BullModule.forRoot({
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
            bullmq_1.BullModule.registerQueue({ name: 'webhook-ingress' }),
            bullmq_1.BullModule.registerQueue({ name: 'ai-processing' }),
            bullmq_1.BullModule.registerQueue({ name: 'automations' }),
            automations_module_1.AutomationsModule,
        ],
        providers: [webhook_processor_1.WebhookProcessor, ai_processor_1.AiProcessor, automations_processor_1.AutomationsProcessor],
        exports: [bullmq_1.BullModule],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map