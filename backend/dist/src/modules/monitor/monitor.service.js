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
exports.MonitorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let MonitorService = class MonitorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveConversations(tenantId) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                tenantId,
                status: {
                    in: ['waiting', 'human_takeover', 'open']
                }
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'asc'
            }
        });
        const assigneeIds = [...new Set(conversations.map(c => c.assignedTo).filter(id => id))];
        const users = await this.prisma.user.findMany({
            where: { id: { in: assigneeIds } }
        });
        const userMap = new Map(users.map(u => [u.id, u]));
        return conversations.map(c => ({
            ...c,
            assignee: c.assignedTo ? userMap.get(c.assignedTo) || null : null,
            lastMessage: c.messages[0] || null,
            lastMessageAt: c.messages[0]?.createdAt || c.updatedAt
        }));
    }
};
exports.MonitorService = MonitorService;
exports.MonitorService = MonitorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MonitorService);
//# sourceMappingURL=monitor.service.js.map