"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../../shared/database/database.module");
const chat_module_1 = require("../chat/chat.module");
const automations_module_1 = require("../automations/automations.module");
const public_api_controller_1 = require("./public-api.controller");
const public_api_service_1 = require("./public-api.service");
const api_tokens_controller_1 = require("./api-tokens.controller");
const api_tokens_service_1 = require("./api-tokens.service");
const public_api_key_guard_1 = require("./guards/public-api-key.guard");
let PublicApiModule = class PublicApiModule {
};
exports.PublicApiModule = PublicApiModule;
exports.PublicApiModule = PublicApiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            chat_module_1.ChatModule,
            automations_module_1.AutomationsModule,
        ],
        controllers: [
            public_api_controller_1.PublicApiController,
            api_tokens_controller_1.ApiTokensController,
        ],
        providers: [
            public_api_service_1.PublicApiService,
            api_tokens_service_1.ApiTokensService,
            public_api_key_guard_1.PublicApiKeyGuard,
        ],
        exports: [
            public_api_service_1.PublicApiService,
            api_tokens_service_1.ApiTokensService,
            public_api_key_guard_1.PublicApiKeyGuard,
        ],
    })
], PublicApiModule);
//# sourceMappingURL=public-api.module.js.map