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
const prisma_service_1 = require("../../shared/database/prisma.service");
let MessagingService = MessagingService_1 = class MessagingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MessagingService_1.name);
    }
    async sendText(payload) {
        try {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: payload.tenantId },
                select: { metaToken: true, metaPhoneNumberId: true }
            });
            if (!tenant || !tenant.metaToken || !tenant.metaPhoneNumberId) {
                this.logger.error(`Credenciais da Meta ausentes para o tenant ${payload.tenantId}`);
                return null;
            }
            const url = `https://graph.facebook.com/v19.0/${tenant.metaPhoneNumberId}/messages`;
            const response = await axios_1.default.post(url, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: payload.phone,
                type: "text",
                text: {
                    preview_url: false,
                    body: payload.content
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${tenant.metaToken}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.log(`Mensagem enviada via Meta API com sucesso para ${payload.phone}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Falha ao enviar mensagem Meta para ${payload.phone}: ${error.response?.data?.error?.message || error.message}`);
            return null;
        }
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map