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
        const where = {};
        if (filters.isSuperAdmin) {
            if (filters.targetTenantId && filters.targetTenantId !== 'ALL') {
                where.tenantId = filters.targetTenantId;
            }
        }
        else {
            where.tenantId = tenantId;
        }
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
        const countWhere = { ...where };
        delete countWhere.status;
        const [tickets, total, open, inProgress, waitingClient, resolved, closed] = await Promise.all([
            this.prisma.supportTicket.findMany({
                where,
                include: {
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            cnpj: true,
                            email: true,
                            phone: true,
                            isActive: true,
                            plan: { select: { name: true } }
                        }
                    },
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
            this.prisma.supportTicket.count({ where: countWhere }),
            this.prisma.supportTicket.count({ where: { ...countWhere, status: 'OPEN' } }),
            this.prisma.supportTicket.count({ where: { ...countWhere, status: 'IN_PROGRESS' } }),
            this.prisma.supportTicket.count({ where: { ...countWhere, status: 'WAITING_CLIENT' } }),
            this.prisma.supportTicket.count({ where: { ...countWhere, status: 'RESOLVED' } }),
            this.prisma.supportTicket.count({ where: { ...countWhere, status: 'CLOSED' } }),
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
    async findOne(id, tenantId, isSuperAdmin) {
        const where = isSuperAdmin ? { id } : { id, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({
            where,
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        cnpj: true,
                        email: true,
                        phone: true,
                        address: true,
                        logoUrl: true,
                        isActive: true,
                        createdAt: true,
                        plan: { select: { id: true, name: true, price: true } },
                        whatsappSettings: true,
                        emailSettings: true,
                        metaPhoneNumberId: true,
                        _count: {
                            select: {
                                users: true,
                                contracts: true,
                                contacts: true,
                                supportTickets: true,
                            }
                        }
                    }
                },
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
    async addMessage(ticketId, tenantId, userId, dto, isSuperAdmin) {
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({
            where,
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
        const senderRole = isSuperAdmin ? 'SUPER_ADMIN' : (sender?.role || 'AGENT');
        const message = await this.prisma.ticketMessage.create({
            data: {
                ticketId,
                senderId: userId,
                senderName: sender?.name || (isSuperAdmin ? 'Super Admin' : 'Operador'),
                senderRole,
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
            if (isSuperAdmin || sender?.role === 'ADMIN' || sender?.role === 'AGENT') {
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
    async updateStatus(ticketId, tenantId, status, isSuperAdmin) {
        const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];
        if (!validStatuses.includes(status)) {
            throw new common_1.BadRequestException(`Status inválido. Escolha entre: ${validStatuses.join(', ')}`);
        }
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({ where });
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
    async assign(ticketId, tenantId, assignedToId, isSuperAdmin) {
        const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
        const ticket = await this.prisma.supportTicket.findFirst({ where });
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