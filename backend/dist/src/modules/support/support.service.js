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
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let SupportService = class SupportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, filters) {
        const where = { tenantId };
        if (filters.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }
        if (filters.priority && filters.priority !== 'ALL') {
            where.priority = filters.priority;
        }
        if (filters.category && filters.category !== 'ALL') {
            where.category = filters.category;
        }
        if (filters.userId) {
            where.userId = filters.userId;
        }
        if (filters.search) {
            where.OR = [
                { subject: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [tickets, total, open, inProgress, waitingClient, resolved, closed] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                    },
                    assignedTo: {
                        select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                    },
                    contact: {
                        select: { id: true, name: true, phone: true, email: true }
                    },
                    _count: {
                        select: { messages: true }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            }),
            this.prisma.supportTicket.count({ where: { tenantId } }),
            this.prisma.supportTicket.count({ where: { tenantId, status: 'OPEN' } }),
            this.prisma.supportTicket.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
            this.prisma.supportTicket.count({ where: { tenantId, status: 'WAITING_CLIENT' } }),
            this.prisma.supportTicket.count({ where: { tenantId, status: 'RESOLVED' } }),
            this.prisma.supportTicket.count({ where: { tenantId, status: 'CLOSED' } }),
        ]);
        return {
            tickets,
            counts: {
                total,
                open,
                inProgress,
                waitingClient,
                resolved,
                closed
            }
        };
    }
    async findOne(id, tenantId) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id, tenantId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                assignedTo: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                contact: {
                    select: { id: true, name: true, phone: true, email: true }
                },
                messages: {
                    include: {
                        sender: {
                            select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        return ticket;
    }
    async create(tenantId, userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true }
        });
        const ticket = await this.prisma.supportTicket.create({
            data: {
                subject: dto.subject.trim(),
                description: dto.description.trim(),
                category: dto.category || 'DUVIDA_TECNICA',
                priority: dto.priority || 'MEDIUM',
                status: 'OPEN',
                tenantId,
                userId,
                contactId: dto.contactId || null,
                messages: {
                    create: {
                        senderId: userId,
                        senderName: user?.name || 'Solicitante',
                        senderRole: user?.role || 'USER',
                        content: dto.description.trim(),
                        isInternal: false
                    }
                }
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                messages: true
            }
        });
        return ticket;
    }
    async addMessage(ticketId, tenantId, userId, dto) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, tenantId },
            include: { user: true }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        const sender = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, role: true }
        });
        const isInternal = Boolean(dto.isInternal);
        const message = await this.prisma.ticketMessage.create({
            data: {
                ticketId,
                senderId: userId,
                senderName: sender?.name || 'Operador',
                senderRole: sender?.role || 'AGENT',
                content: dto.content.trim(),
                isInternal,
                attachments: dto.attachments || null
            },
            include: {
                sender: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                }
            }
        });
        let nextStatus = ticket.status;
        if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
            nextStatus = 'IN_PROGRESS';
        }
        else if (!isInternal) {
            if (sender?.role === 'ADMIN' || sender?.role === 'AGENT') {
                nextStatus = 'WAITING_CLIENT';
            }
            else {
                nextStatus = 'IN_PROGRESS';
            }
        }
        await this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                status: nextStatus,
                updatedAt: new Date()
            }
        });
        return message;
    }
    async updateStatus(ticketId, tenantId, status) {
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException(`Status inválido. Escolha entre: ${validStatuses.join(', ')}`);
        }
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, tenantId }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        return this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status, updatedAt: new Date() },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                },
                assignedTo: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                }
            }
        });
    }
    async assign(ticketId, tenantId, assignedToId) {
        const ticket = await this.prisma.supportTicket.findFirst({
            where: { id: ticketId, tenantId }
        });
        if (!ticket) {
            throw new common_1.NotFoundException('Chamado de suporte não encontrado.');
        }
        return this.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                assignedToId: assignedToId || null,
                status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
                updatedAt: new Date()
            },
            include: {
                assignedTo: {
                    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
                }
            }
        });
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportService);
//# sourceMappingURL=support.service.js.map