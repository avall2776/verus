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
const emails_service_1 = require("../emails/emails.service");
const bcrypt = require("bcrypt");
let TenantsService = class TenantsService {
    constructor(prisma, emailsService) {
        this.prisma = prisma;
        this.emailsService = emailsService;
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
                        isActive: true,
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
    async ensureStandardPlans() {
        const defaultPlans = [
            {
                name: 'Básico',
                price: 99.00,
                hasCRM: false,
                hasWhatsApp: true,
                hasInstagram: false,
                hasAIAgent: false,
                maxUsers: 1,
                maxAIMsgs: 0,
                maxWorkspaces: 1,
                modules: {
                    crm: false,
                    whatsapp: true,
                    aiAgent: false,
                    emailInbox: false,
                    analytics: false,
                    goals: false,
                    proposalsContracts: false,
                    automations: false,
                    support: true,
                    teamChat: true,
                },
            },
            {
                name: 'Pro',
                price: 199.90,
                hasCRM: true,
                hasWhatsApp: true,
                hasInstagram: false,
                hasAIAgent: true,
                maxUsers: 3,
                maxAIMsgs: 2000,
                maxWorkspaces: 3,
                modules: {
                    crm: true,
                    whatsapp: true,
                    aiAgent: true,
                    emailInbox: true,
                    analytics: false,
                    goals: true,
                    proposalsContracts: true,
                    automations: true,
                    support: true,
                    teamChat: true,
                },
            },
            {
                name: 'Enterprise',
                price: 499.00,
                hasCRM: true,
                hasWhatsApp: true,
                hasInstagram: true,
                hasAIAgent: true,
                maxUsers: 10,
                maxAIMsgs: 10000,
                maxWorkspaces: 10,
                modules: {
                    crm: true,
                    whatsapp: true,
                    aiAgent: true,
                    emailInbox: true,
                    analytics: true,
                    goals: true,
                    proposalsContracts: true,
                    automations: true,
                    support: true,
                    teamChat: true,
                },
            },
        ];
        for (const dp of defaultPlans) {
            const existing = await this.prisma.plan.findFirst({
                where: { name: { equals: dp.name, mode: 'insensitive' } },
            });
            if (!existing) {
                await this.prisma.plan.create({ data: dp });
            }
            else if (!existing.modules) {
                await this.prisma.plan.update({
                    where: { id: existing.id },
                    data: {
                        modules: dp.modules,
                        hasCRM: dp.hasCRM,
                        hasWhatsApp: dp.hasWhatsApp,
                        hasAIAgent: dp.hasAIAgent,
                        hasInstagram: dp.hasInstagram,
                    },
                });
            }
        }
    }
    async getPlans() {
        await this.ensureStandardPlans();
        return this.prisma.plan.findMany({
            orderBy: { price: 'asc' },
        });
    }
    async createPlan(dto) {
        if (!dto.name || dto.price === undefined) {
            throw new common_1.BadRequestException('Nome e preço do plano são obrigatórios.');
        }
        const modules = dto.modules || {
            crm: dto.hasCRM ?? false,
            whatsapp: dto.hasWhatsApp ?? true,
            aiAgent: dto.hasAIAgent ?? false,
            emailInbox: false,
            analytics: false,
            goals: false,
            proposalsContracts: false,
            automations: false,
            support: true,
            teamChat: true,
        };
        const created = await this.prisma.plan.create({
            data: {
                name: dto.name.trim(),
                price: dto.price,
                hasCRM: modules.crm ?? dto.hasCRM ?? false,
                hasWhatsApp: modules.whatsapp ?? dto.hasWhatsApp ?? true,
                hasInstagram: modules.instagram ?? dto.hasInstagram ?? false,
                hasAIAgent: modules.aiAgent ?? dto.hasAIAgent ?? false,
                maxUsers: dto.maxUsers ?? 1,
                maxAIMsgs: dto.maxAIMsgs ?? 0,
                maxWorkspaces: dto.maxWorkspaces ?? 1,
                modules,
            },
        });
        return created;
    }
    async updatePlan(id, dto) {
        const plan = await this.prisma.plan.findUnique({ where: { id } });
        if (!plan)
            throw new common_1.NotFoundException('Plano não encontrado.');
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.price !== undefined)
            data.price = dto.price;
        if (dto.hasCRM !== undefined)
            data.hasCRM = dto.hasCRM;
        if (dto.hasWhatsApp !== undefined)
            data.hasWhatsApp = dto.hasWhatsApp;
        if (dto.hasInstagram !== undefined)
            data.hasInstagram = dto.hasInstagram;
        if (dto.hasAIAgent !== undefined)
            data.hasAIAgent = dto.hasAIAgent;
        if (dto.maxUsers !== undefined)
            data.maxUsers = dto.maxUsers;
        if (dto.maxAIMsgs !== undefined)
            data.maxAIMsgs = dto.maxAIMsgs;
        if (dto.maxWorkspaces !== undefined)
            data.maxWorkspaces = dto.maxWorkspaces;
        if (dto.modules !== undefined) {
            data.modules = dto.modules;
            if (dto.modules.crm !== undefined)
                data.hasCRM = Boolean(dto.modules.crm);
            if (dto.modules.whatsapp !== undefined)
                data.hasWhatsApp = Boolean(dto.modules.whatsapp);
            if (dto.modules.aiAgent !== undefined)
                data.hasAIAgent = Boolean(dto.modules.aiAgent);
            if (dto.modules.instagram !== undefined)
                data.hasInstagram = Boolean(dto.modules.instagram);
        }
        return this.prisma.plan.update({
            where: { id },
            data,
        });
    }
    async create(dto) {
        let planId = dto.planId;
        if (!planId && dto.customPlan) {
            const custom = await this.createPlan(dto.customPlan);
            planId = custom.id;
        }
        if (!planId) {
            await this.ensureStandardPlans();
            const firstPlan = await this.prisma.plan.findFirst({ orderBy: { price: 'asc' } });
            if (!firstPlan)
                throw new common_1.BadRequestException('Nenhum plano disponível.');
            planId = firstPlan.id;
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.adminEmail.toLowerCase().trim() },
        });
        if (existingUser) {
            throw new common_1.BadRequestException('Já existe um usuário cadastrado com este e-mail.');
        }
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
        const result = await this.prisma.$transaction(async (tx) => {
            const tenant = await tx.tenant.create({
                data: {
                    name: dto.name.trim(),
                    cnpj: dto.cnpj?.trim() || null,
                    email: dto.email?.trim() || dto.adminEmail.toLowerCase().trim(),
                    phone: dto.phone?.trim() || null,
                    address: dto.address?.trim() || null,
                    planId,
                    isActive: true,
                },
                include: {
                    plan: true,
                },
            });
            const user = await tx.user.create({
                data: {
                    name: dto.adminName.trim(),
                    email: dto.adminEmail.toLowerCase().trim(),
                    password: hashedPassword,
                    role: 'ADMIN',
                    isActive: true,
                    isSuperAdmin: false,
                    tenantId: tenant.id,
                },
            });
            return { tenant, user };
        });
        return {
            message: `Empresa "${result.tenant.name}" e administrador "${result.user.name}" criados com sucesso!`,
            tenant: result.tenant,
            adminUser: {
                id: result.user.id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
            },
        };
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
    async updateTenantUser(tenantId, userId, dto) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuário não encontrado nesta empresa.');
        }
        const data = {};
        if (dto.name !== undefined) {
            const name = dto.name?.trim();
            if (!name) {
                throw new common_1.BadRequestException('O nome do usuário não pode ficar vazio.');
            }
            data.name = name;
        }
        if (dto.email !== undefined) {
            const email = dto.email?.trim().toLowerCase();
            if (!email || !email.includes('@')) {
                throw new common_1.BadRequestException('E-mail informado é inválido.');
            }
            const existing = await this.prisma.user.findFirst({
                where: { email, id: { not: userId } },
            });
            if (existing) {
                throw new common_1.BadRequestException('Este e-mail já está sendo utilizado por outro usuário no sistema.');
            }
            data.email = email;
        }
        if (dto.role !== undefined) {
            const role = dto.role.toUpperCase();
            if (role !== 'ADMIN' && role !== 'AGENT') {
                throw new common_1.BadRequestException('Papel inválido. Escolha ADMIN ou AGENT.');
            }
            data.role = role;
        }
        if (dto.isActive !== undefined) {
            data.isActive = Boolean(dto.isActive);
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                avatarUrl: true,
                isOnline: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return {
            message: `Usuário '${updated.name}' atualizado com sucesso!`,
            user: updated,
        };
    }
    async resetTenantUserPassword(tenantId, userId, dto) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuário não encontrado nesta empresa.');
        }
        const plainPassword = dto.newPassword && dto.newPassword.trim().length >= 6
            ? dto.newPassword.trim()
            : `Versus@${Math.floor(100000 + Math.random() * 900000)}`;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        let emailSent = false;
        let emailError;
        if (dto.sendEmail) {
            try {
                const sendRes = await this.emailsService.sendUserPasswordResetEmail({
                    tenantId,
                    recipientEmail: user.email,
                    recipientName: user.name,
                    newPassword: plainPassword,
                });
                emailSent = sendRes.sent;
                emailError = sendRes.error;
            }
            catch (err) {
                emailError = err.message;
            }
        }
        return {
            message: `Senha do usuário '${user.name}' redefinida com sucesso!`,
            temporaryPassword: plainPassword,
            emailSent,
            emailError,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        };
    }
    async deleteTenantUser(tenantId, userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuário não encontrado nesta empresa.');
        }
        if (user.isSuperAdmin || user.role === 'SUPER_ADMIN') {
            throw new common_1.BadRequestException('Usuários com permissão de Super Admin não podem ser excluídos por este painel.');
        }
        await this.prisma.deal.updateMany({
            where: { assignedTo: userId },
            data: { assignedTo: null },
        });
        await this.prisma.userDepartment.deleteMany({
            where: { userId },
        });
        await this.prisma.goal.updateMany({
            where: { userId },
            data: { userId: null },
        });
        await this.prisma.supportTicket.updateMany({
            where: { userId },
            data: { userId: null },
        });
        await this.prisma.supportTicket.updateMany({
            where: { assignedToId: userId },
            data: { assignedToId: null },
        });
        await this.prisma.ticketMessage.updateMany({
            where: { senderId: userId },
            data: { senderId: null },
        });
        await this.prisma.teamMessage.deleteMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
        });
        await this.prisma.user.delete({
            where: { id: userId },
        });
        return {
            success: true,
            message: `Usuário '${user.name}' (${user.email}) removido permanentemente com sucesso do banco de dados.`,
        };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        emails_service_1.EmailsService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map