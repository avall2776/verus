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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let WhatsappService = class WhatsappService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getConfig(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaToken: true, metaPhoneNumberId: true, whatsappSettings: true }
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const maskedToken = tenant.metaToken ? `${tenant.metaToken.substring(0, 15)}...` : null;
        return {
            metaToken: maskedToken,
            hasToken: !!tenant.metaToken,
            metaPhoneNumberId: tenant.metaPhoneNumberId,
            whatsappSettings: tenant.whatsappSettings || {
                antiBanEnabled: true,
                typingDelayMs: 1500,
                messageDelayMs: 3000
            },
            status: !!tenant.metaToken ? 'connected' : 'disconnected'
        };
    }
    async updateConfig(tenantId, data) {
        const updateData = {};
        if (data.metaToken && !data.metaToken.includes('...')) {
            updateData.metaToken = data.metaToken;
        }
        if (data.metaPhoneNumberId !== undefined) {
            updateData.metaPhoneNumberId = data.metaPhoneNumberId;
        }
        if (data.whatsappSettings) {
            updateData.whatsappSettings = data.whatsappSettings;
        }
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: updateData
        });
        return { success: true };
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map