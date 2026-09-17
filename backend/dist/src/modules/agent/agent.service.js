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
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let AgentService = class AgentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getConfig(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                aiName: true,
                aiModel: true,
                aiPrompt: true,
                aiKnowledgeBase: true,
                aiTemperature: true,
            }
        });
        return tenant;
    }
    async updateConfig(tenantId, data) {
        const rawTemp = data.aiTemperature !== undefined ? parseFloat(String(data.aiTemperature)) : 0.7;
        const safeTemp = isNaN(rawTemp) ? 0.7 : Math.min(Math.max(rawTemp, 0), 1.5);
        const safeModel = (data.aiModel === 'gpt-4o' || data.aiModel === 'gpt-4o-mini') ? data.aiModel : 'gpt-4o-mini';
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                aiName: data.aiName,
                aiModel: safeModel,
                aiPrompt: data.aiPrompt,
                aiKnowledgeBase: data.aiKnowledgeBase,
                aiTemperature: safeTemp,
            },
            select: {
                aiName: true,
                aiModel: true,
                aiPrompt: true,
                aiKnowledgeBase: true,
                aiTemperature: true,
            }
        });
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentService);
//# sourceMappingURL=agent.service.js.map