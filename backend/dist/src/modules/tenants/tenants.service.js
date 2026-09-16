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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const bcrypt = require("bcrypt");
let TenantsService = class TenantsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = Math.max(1, parseInt(query.page || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status === 'ACTIVE') {
            where.isActive = true;
        }
        else if (query.status === 'BLOCKED') {
            where.isActive = false;
        }
        if (query.planId && query.planId !== 'ALL') {
            where.planId = query.planId;
        }
        if (query.search && query.search.trim()) {
            const term = query.search.trim();
            where.OR = [
                { name: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { cnpj: { contains: term, mode: 'insensitive' } },
                { phone: { contains: term, mode: 'insensitive' } },
            ];
        }
        const [tenants, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    plan: {
                        select: { id: true, name: true, price: true },
                    },
                    users: {
                        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
                        select: { id: true, name: true, email: true, isOnline: true },
                        take: 1,
                    },
                    whatsappInstances: {
                        select: { id: true, status: true, name: true },
                        take: 1,
                    },
                    _count: {
                        select: {
                            users: true,
                            contracts: true,
                            contacts: true,
                            supportTickets: true,
                        },
                    },
                },
            }),
            this.prisma.tenant.count({ where }),
        ]);
        const formatted = await Promise.all(tenants.map(async (tenant) => {
            const [openTickets, dealsCount] = await Promise.all([
                this.prisma.supportTicket.count({
                    where: {
                        tenantId: tenant.id,
                        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] },
                    },
                }),
                this.prisma.deal.count({
                    where: { tenantId: tenant.id },
                }),
            ]);
            const emailSettings = tenant.emailSettings;
            const whatsappConnected = Boolean(tenant.metaPhoneNumberId ||
                tenant.whatsappInstances.some((inst) => inst.status === 'CONNECTED') ||
                tenant.whatsappSettings?.antiBanEnabled !== undefined);
            const smtpConfigured = Boolean(emailSettings?.isActive ||
                emailSettings?.smtpHost ||
                emailSettings?.resendApiKey);
            return {
                id: tenant.id,
                name: tenant.name,
                cnpj: tenant.cnpj,
                email: tenant.email,
                phone: tenant.phone,
                address: tenant.address,
                logoUrl: tenant.logoUrl,
                isActive: tenant.isActive,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
                plan: tenant.plan,
                adminUser: tenant.users[0] || null,
                connections: {
                    whatsapp: whatsappConnected,
                    smtp: smtpConfigured,
                },
                counts: {
                    users: tenant._count.users,
                    contracts: tenant._count.contracts,
                    deals: dealsCount,
                    contacts: tenant._count.contacts,
                    supportTickets: tenant._count.supportTickets,
                    openTickets,
                },
            };
        }));
        return {
            data: formatted,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getStats() {
        const [totalTenants, activeTenants, blockedTenants, totalUsers, totalContracts, openTickets, tenantsWithPlans,] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { isActive: true } }),
            this.prisma.tenant.count({ where: { isActive: false } }),
            this.prisma.user.count(),
            this.prisma.contract.count(),
            this.prisma.supportTicket.count({
                where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] } },
            }),
            this.prisma.tenant.findMany({
                where: { isActive: true },
                select: { plan: { select: { price: true } } },
            }),
        ]);
        const estimatedMRR = tenantsWithPlans.reduce((acc, t) => {
            const price = Number(t.plan?.price || 0);
            return acc + price;
        }, 0);
        return {
            totalTenants,
            activeTenants,
            blockedTenants,
            totalUsers,
            totalContracts,
            openTickets,
            estimatedMRR,
        };
    }
    async findOne(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                plan: true,
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        avatarUrl: true,
                        isOnline: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
                whatsappInstances: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        phoneNumber: true,
                        updatedAt: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        contracts: true,
                        contacts: true,
                        supportTickets: true,
                    },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const [contractsSummary, dealsSummary, recentTickets] = await Promise.all([
            this.prisma.contract.aggregate({
                where: { tenantId: id },
                _count: { id: true },
                _sum: { value: true },
            }),
            this.prisma.deal.aggregate({
                where: { tenantId: id },
                _count: { id: true },
                _sum: { value: true },
            }),
            this.prisma.supportTicket.findMany({
                where: { tenantId: id },
                take: 10,
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                    _count: {
                        select: { messages: true },
                    },
                },
            }),
        ]);
        const signedContractsSummary = await this.prisma.contract.aggregate({
            where: { tenantId: id, status: 'SIGNED' },
            _count: { id: true },
            _sum: { value: true },
        });
        const emailSettings = tenant.emailSettings;
        const whatsappConnected = Boolean(tenant.metaPhoneNumberId ||
            tenant.whatsappInstances.some((inst) => inst.status === 'CONNECTED') ||
            tenant.whatsappSettings?.antiBanEnabled !== undefined);
        const smtpConfigured = Boolean(emailSettings?.isActive ||
            emailSettings?.smtpHost ||
            emailSettings?.resendApiKey);
        return {
            company: {
                id: tenant.id,
                name: tenant.name,
                cnpj: tenant.cnpj,
                email: tenant.email,
                phone: tenant.phone,
                address: tenant.address,
                logoUrl: tenant.logoUrl,
                isActive: tenant.isActive,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
                plan: tenant.plan,
            },
            diagnostics: {
                whatsapp: {
                    connected: whatsappConnected,
                    phoneNumberId: tenant.metaPhoneNumberId,
                    instances: tenant.whatsappInstances,
                    settings: tenant.whatsappSettings,
                },
                smtp: {
                    configured: smtpConfigured,
                    provider: emailSettings?.provider || 'SMTP',
                    fromEmail: emailSettings?.fromEmail || null,
                    fromName: emailSettings?.fromName || null,
                    host: emailSettings?.smtpHost || null,
                    isActive: emailSettings?.isActive || false,
                },
            },
            metrics: {
                totalUsers: tenant._count.users,
                totalContacts: tenant._count.contacts,
                totalDeals: dealsSummary._count.id || 0,
                dealsValue: dealsSummary._sum.value || 0,
                totalContracts: contractsSummary._count.id || 0,
                signedContracts: signedContractsSummary._count.id || 0,
                signedContractsValue: signedContractsSummary._sum.value || 0,
                totalTickets: tenant._count.supportTickets,
            },
            users: tenant.users,
            recentTickets: recentTickets.map((t) => ({
                id: t.id,
                ticketNumber: t.ticketNumber,
                subject: t.subject,
                status: t.status,
                priority: t.priority,
                category: t.category,
                requester: t.user?.name || 'Usuário',
                messagesCount: t._count.messages,
                updatedAt: t.updatedAt,
            })),
        };
    }
    async updateStatus(id, isActive) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const updated = await this.prisma.tenant.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                name: true,
                isActive: true,
                updatedAt: true,
            },
        });
        return {
            message: isActive
                ? `Acesso da empresa '${updated.name}' foi desbloqueado com sucesso.`
                : `Acesso da empresa '${updated.name}' foi bloqueado com sucesso.`,
            tenant: updated,
        };
    }
    async resetAdminPassword(id, newPassword) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                users: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const adminUser = tenant.users.find((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') ||
            tenant.users[0];
        if (!adminUser) {
            throw new common_1.NotFoundException('Nenhum usuário administrador cadastrado nesta empresa.');
        }
        const plainPassword = newPassword && newPassword.trim().length >= 6
            ? newPassword.trim()
            : `Versus@${Math.floor(100000 + Math.random() * 900000)}`;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await this.prisma.user.update({
            where: { id: adminUser.id },
            data: { password: hashedPassword },
        });
        return {
            message: `Senha do administrador ${adminUser.name} (${adminUser.email}) redefinida com sucesso.`,
            user: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
            },
            temporaryPassword: plainPassword,
        };
    }
    async getMyTenant(tenantId) {
        if (!tenantId)
            throw new common_1.BadRequestException('Tenant não identificado.');
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                plan: true,
                _count: {
                    select: {
                        users: true,
                        contracts: true,
                        contacts: true,
                        supportTickets: true,
                    }
                }
            }
        });
        if (!tenant)
            throw new common_1.NotFoundException('Empresa não encontrada.');
        return tenant;
    }
    async updateMyTenant(tenantId, data) {
        if (!tenantId)
            throw new common_1.BadRequestException('Tenant não identificado.');
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name.trim();
        if (data.cnpj !== undefined)
            updateData.cnpj = data.cnpj.trim();
        if (data.email !== undefined)
            updateData.email = data.email.trim();
        if (data.phone !== undefined)
            updateData.phone = data.phone.trim();
        if (data.address !== undefined)
            updateData.address = data.address.trim();
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data: updateData,
        });
    }
    async getPlans() {
        return this.prisma.plan.findMany({
            orderBy: { price: 'desc' },
        });
    }
    async update(id, dto) {
        const tenant = await this.prisma.tenant.findUnique({ where: { id } });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.cnpj !== undefined)
            data.cnpj = dto.cnpj.trim();
        if (dto.email !== undefined)
            data.email = dto.email.trim();
        if (dto.phone !== undefined)
            data.phone = dto.phone.trim();
        if (dto.address !== undefined)
            data.address = dto.address.trim();
        if (dto.logoUrl !== undefined)
            data.logoUrl = dto.logoUrl ? dto.logoUrl.trim() : null;
        if (dto.isActive !== undefined)
            data.isActive = Boolean(dto.isActive);
        if (dto.planId) {
            const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
            if (!plan) {
                throw new common_1.BadRequestException('Plano informado não existe.');
            }
            data.planId = dto.planId;
        }
        const updated = await this.prisma.tenant.update({
            where: { id },
            data,
            include: {
                plan: {
                    select: { id: true, name: true, price: true },
                },
            },
        });
        return {
            message: `Empresa "${updated.name}" atualizada com sucesso.`,
            tenant: updated,
        };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map