"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const database_module_1 = require("../../shared/database/database.module");
const messaging_module_1 = require("../messaging/messaging.module");
const auth_module_1 = require("../auth/auth.module");
const chat_service_1 = require("./chat.service");
const chat_controller_1 = require("./chat.controller");
const chat_alias_controller_1 = require("./chat-alias.controller");
const media_controller_1 = require("./media.controller");
const chat_gateway_1 = require("./chat.gateway");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            messaging_module_1.MessagingModule,
            auth_module_1.AuthModule,
            bullmq_1.BullModule.registerQueue({ name: 'scheduled-messages' }),
        ],
        providers: [chat_service_1.ChatService, chat_gateway_1.ChatGateway],
        controllers: [chat_controller_1.ChatController, chat_alias_controller_1.ChatAliasController, media_controller_1.MediaController],
        exports: [chat_gateway_1.ChatGateway, chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map