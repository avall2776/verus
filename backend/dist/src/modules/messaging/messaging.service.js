"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
let MessagingService = MessagingService_1 = class MessagingService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(MessagingService_1.name);
        this.evolutionApiUrl = this.configService.get('EVOLUTION_API_URL') || 'http://localhost:8080';
        this.evolutionApiKey = this.configService.get('EVOLUTION_API_KEY') || '';
    }
    async sendText(payload, instanceName = 'default') {
        try {
            const url = `${this.evolutionApiUrl}/message/sendText/${instanceName}`;
            const response = await axios_1.default.post(url, {
                number: payload.phone,
                text: payload.content,
            }, {
                headers: {
                    'apikey': this.evolutionApiKey,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.log(`Mensagem enviada com sucesso para ${payload.phone}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Falha ao enviar mensagem para ${payload.phone}: ${error.message}`);
            return null;
        }
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map