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
var TenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const emails_service_1 = require("../emails/emails.service");
const ai_service_1 = require("../ai/ai.service");
const crypto_util_1 = require("../../shared/utils/crypto.util");
const bcrypt = require("bcrypt");
const axios_1 = require("axios");
let TenantsService = TenantsService_1 = class TenantsService {
    constructor(prisma, emailsService, aiService) {
        this.prisma = prisma;
        this.emailsService = emailsService;
        this.aiService = aiService;
        this.logger = new common_1.Logger(TenantsService_1.name);
    }
    async getActiveEvolutionInstances() {
        const instancesMap = new Map();
        try {
            const serverUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
            const apiKey = process.env.EVOLUTION_API_KEY || 'verto123';
            const res = await axios_1.default.get(`${serverUrl}/instance/fetchInstances`, {
                headers: { apikey: apiKey },
                timeout: 2500,
            });
            const list = Array.isArray(res.data) ? res.data : [];
            for (const item of list) {
                const evo = item.instance || item;
                const name = String(evo.instanceName || '').trim();
                const status = String(evo.status || evo.connectionStatus || '').toLowerCase();
                if (name) {
                    instancesMap.set(name, {
                        status,
                        owner: evo.owner ? String(evo.owner).replace(/\D/g, '') : undefined,
                        profileName: evo.profileName,
                    });
                }
            }
        }
        catch (err) {
            this.logger.debug(`Consulta à Evolution API ignorada: ${err.message}`);
        }
        return instancesMap;
    }
    resolveTenantWhatsAppStatus(tenant, liveEvolutionMap) {
        if (tenant.metaPhoneNumberId && String(tenant.metaPhoneNumberId).trim().length > 5) {
            return {
                connected: true,
                provider: 'meta',
                phone: String(tenant.metaPhoneNumberId),
            };
        }
        const instances = tenant.whatsappInstances || [];
        for (const inst of instances) {
            const dbStatus = String(inst.status || '').toLowerCase().trim();
            const instanceName = inst.settings?.instanceName || inst.name;
            const liveEvo = instanceName ? liveEvolutionMap.get(instanceName) : null;
            const isLiveOpen = liveEvo && (liveEvo.status === 'open' || liveEvo.status === 'connected');
            const isDbConnected = ['connected', 'open', 'active', 'online'].includes(dbStatus);
            if (isLiveOpen || isDbConnected) {
                return {
                    connected: true,
                    provider: inst.settings?.provider || 'evolution',
                    phone: inst.phoneNumber || liveEvo?.owner || null,
                };
            }
        }
        const tenantPrefix = `versus_${tenant.id.replace(/-/g, '').substring(0, 10)}`;
        for (const [evoName, evoData] of liveEvolutionMap.entries()) {
            if (evoName.startsWith(tenantPrefix) && (evoData.status === 'open' || evoData.status === 'connected')) {
                return {
                    connected: true,
                    provider: 'evolution',
                    phone: evoData.owner || null,
                };
            }
        }
        return {
            connected: false,
            provider: null,
            phone: null,
        };
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
                        select: { id: true, name: true, email: true, isOnline: true, rawPasswordEncrypted: true },
                        take: 1,
                    },
                    whatsappInstances: {
                        select: { id: true, status: true, name: true, phoneNumber: true, settings: true },
                        orderBy: { updatedAt: 'desc' },
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
        const liveEvolutionMap = await this.getActiveEvolutionInstances();
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
            const waInfo = this.resolveTenantWhatsAppStatus(tenant, liveEvolutionMap);
            const smtpConfigured = Boolean(emailSettings?.isActive ||
                emailSettings?.smtpHost ||
                emailSettings?.resendApiKey);
            const firstAdmin = tenant.users[0] || null;
            let adminSavedPassword = null;
            if (firstAdmin?.rawPasswordEncrypted) {
                try {
                    adminSavedPassword = (0, crypto_util_1.decryptApiKey)(firstAdmin.rawPasswordEncrypted);
                }
                catch {
                    adminSavedPassword = null;
                }
            }
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
                adminUser: firstAdmin
                    ? {
                        id: firstAdmin.id,
                        name: firstAdmin.name,
                        email: firstAdmin.email,
                        isOnline: firstAdmin.isOnline,
                        savedPassword: adminSavedPassword,
                    }
                    : null,
                connections: {
                    whatsapp: waInfo.connected,
                    whatsappPhone: waInfo.phone,
                    whatsappProvider: waInfo.provider,
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
                        rawPasswordEncrypted: true,
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
        const [liveEvolutionMap, signedContractsSummary] = await Promise.all([
            this.getActiveEvolutionInstances(),
            this.prisma.contract.aggregate({
                where: { tenantId: id, status: 'SIGNED' },
                _count: { id: true },
                _sum: { value: true },
            }),
        ]);
        const emailSettings = tenant.emailSettings;
        const waInfo = this.resolveTenantWhatsAppStatus(tenant, liveEvolutionMap);
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
                leadNotificationPhone: tenant.leadNotificationPhone,
                address: tenant.address,
                logoUrl: tenant.logoUrl,
                isActive: tenant.isActive,
                aiEnabled: tenant.aiEnabled !== false,
                createdAt: tenant.createdAt,
                updatedAt: tenant.updatedAt,
                plan: tenant.plan,
            },
            diagnostics: {
                whatsapp: {
                    connected: waInfo.connected,
                    provider: waInfo.provider,
                    phoneNumber: waInfo.phone || tenant.metaPhoneNumberId,
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
            users: (tenant.users || []).map((u) => {
                let savedPassword = null;
                if (u.rawPasswordEncrypted) {
                    try {
                        savedPassword = (0, crypto_util_1.decryptApiKey)(u.rawPasswordEncrypted);
                    }
                    catch {
                        savedPassword = null;
                    }
                }
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    isActive: u.isActive,
                    avatarUrl: u.avatarUrl,
                    isOnline: u.isOnline,
                    createdAt: u.createdAt,
                    savedPassword,
                };
            }),
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
        const trimmed = newPassword ? String(newPassword).trim() : '';
        const plainPassword = trimmed.length > 0
            ? trimmed
            : `Versus@${Math.floor(100000 + Math.random() * 900000)}`;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const rawPasswordEncrypted = (0, crypto_util_1.encryptApiKey)(plainPassword);
        await this.prisma.user.update({
            where: { id: adminUser.id },
            data: {
                password: hashedPassword,
                rawPasswordEncrypted,
            },
        });
        return {
            message: `Senha do administrador ${adminUser.name} (${adminUser.email}) redefinida e salva com sucesso.`,
            user: {
                id: adminUser.id,
                name: adminUser.name,
                email: adminUser.email,
                role: adminUser.role,
                savedPassword: plainPassword,
            },
            temporaryPassword: plainPassword,
            savedPassword: plainPassword,
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
        if (data.leadNotificationPhone !== undefined)
            updateData.leadNotificationPhone = data.leadNotificationPhone ? data.leadNotificationPhone.trim() : null;
        if (data.address !== undefined)
            updateData.address = data.address.trim();
        if (data.aiEnabled !== undefined)
            updateData.aiEnabled = Boolean(data.aiEnabled);
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
        const rawAdminPass = dto.adminPassword?.trim() || 'Versus@123456';
        const hashedPassword = await bcrypt.hash(rawAdminPass, 10);
        const rawPasswordEncrypted = (0, crypto_util_1.encryptApiKey)(rawAdminPass);
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
                    rawPasswordEncrypted,
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
                savedPassword: rawAdminPass,
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
            data.name = dto.name ? String(dto.name).trim() : '';
        if (dto.cnpj !== undefined)
            data.cnpj = dto.cnpj ? String(dto.cnpj).trim() : null;
        if (dto.email !== undefined)
            data.email = dto.email ? String(dto.email).trim() : null;
        if (dto.phone !== undefined)
            data.phone = dto.phone ? String(dto.phone).trim() : null;
        if (dto.leadNotificationPhone !== undefined)
            data.leadNotificationPhone = dto.leadNotificationPhone ? String(dto.leadNotificationPhone).trim() : null;
        if (dto.address !== undefined)
            data.address = dto.address ? String(dto.address).trim() : null;
        if (dto.logoUrl !== undefined)
            data.logoUrl = dto.logoUrl ? String(dto.logoUrl).trim() : null;
        if (dto.isActive !== undefined)
            data.isActive = Boolean(dto.isActive);
        if (dto.aiEnabled !== undefined)
            data.aiEnabled = Boolean(dto.aiEnabled);
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
        if (dto.password && String(dto.password).trim()) {
            const p = String(dto.password).trim();
            data.password = await bcrypt.hash(p, 10);
            data.rawPasswordEncrypted = (0, crypto_util_1.encryptApiKey)(p);
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
        const trimmed = dto.newPassword ? String(dto.newPassword).trim() : '';
        const plainPassword = trimmed.length > 0
            ? trimmed
            : `Versus@${Math.floor(100000 + Math.random() * 900000)}`;
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const rawPasswordEncrypted = (0, crypto_util_1.encryptApiKey)(plainPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                rawPasswordEncrypted,
            },
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
            message: `Senha do usuário '${user.name}' redefinida e salva com sucesso!`,
            temporaryPassword: plainPassword,
            savedPassword: plainPassword,
            emailSent,
            emailError,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                savedPassword: plainPassword,
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
    async getAiStatus(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                createdAt: true,
                aiEnabled: true,
                aiModel: true,
                aiTrialStartedAt: true,
                aiTrialDays: true,
                aiPlatformKeyAllowed: true,
                aiCustomApiKey: true,
                aiKeyType: true,
                aiKeyStatus: true,
                aiLastKeyTestAt: true,
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const keyResolution = this.aiService.resolveTenantApiKey(tenant);
        const hasCustomKey = Boolean(tenant.aiCustomApiKey && tenant.aiCustomApiKey.trim().length > 0);
        const decryptedKey = hasCustomKey ? (0, crypto_util_1.decryptApiKey)(tenant.aiCustomApiKey) : '';
        const maskedCustomKey = decryptedKey ? (0, crypto_util_1.maskApiKey)(decryptedKey) : null;
        return {
            canUseAi: keyResolution.canUseAi,
            source: keyResolution.source,
            daysLeft: keyResolution.daysLeft,
            totalTrialDays: keyResolution.totalTrialDays,
            statusText: keyResolution.statusText,
            isPlatformAllowed: keyResolution.isPlatformAllowed,
            hasCustomKey,
            maskedCustomKey,
            aiModel: tenant.aiModel,
            aiEnabled: tenant.aiEnabled,
            lastKeyTestAt: tenant.aiLastKeyTestAt,
            trialStartedAt: tenant.aiTrialStartedAt || tenant.createdAt,
        };
    }
    async testClientAiKey(tenantId, apiKey) {
        let keyToTest = apiKey?.trim();
        if (!keyToTest) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { aiCustomApiKey: true },
            });
            if (!tenant?.aiCustomApiKey) {
                throw new common_1.BadRequestException('Nenhuma chave própria cadastrada para testar. Digite uma chave para testar.');
            }
            keyToTest = (0, crypto_util_1.decryptApiKey)(tenant.aiCustomApiKey);
        }
        const result = await this.aiService.testApiKey(keyToTest);
        if (result.success) {
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { aiLastKeyTestAt: new Date() },
            });
        }
        return result;
    }
    async saveCustomAiKey(tenantId, plainKey) {
        const trimmed = (plainKey || '').trim();
        if (!trimmed || trimmed.length < 15) {
            throw new common_1.BadRequestException('Chave da OpenAI inválida. Formato esperado: sk-...');
        }
        this.logger.log(`Validando chave OpenAI fornecida pelo tenant [${tenantId}]...`);
        const testResult = await this.aiService.testApiKey(trimmed);
        if (!testResult.success) {
            throw new common_1.BadRequestException(`Não foi possível ativar esta chave: ${testResult.message || testResult.error}`);
        }
        const encrypted = (0, crypto_util_1.encryptApiKey)(trimmed);
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                aiCustomApiKey: encrypted,
                aiKeyType: 'custom',
                aiKeyStatus: 'byok_active',
                aiLastKeyTestAt: new Date(),
            },
        });
        this.logger.log(`Chave OpenAI própria ativada com sucesso para o tenant [${tenantId}].`);
        return {
            success: true,
            message: 'Chave própria da OpenAI configurada e validada com sucesso! Seu robô de IA agora utiliza seus próprios créditos.',
            maskedKey: (0, crypto_util_1.maskApiKey)(trimmed),
        };
    }
    async removeCustomAiKey(tenantId) {
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                aiCustomApiKey: null,
                aiKeyType: 'platform',
                aiKeyStatus: 'trial_active',
            },
        });
        return {
            success: true,
            message: 'Chave própria removida com sucesso. A empresa retornou para a política de degustação da plataforma.',
        };
    }
    async getSuperTenantAi(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                createdAt: true,
                aiEnabled: true,
                aiModel: true,
                aiTrialStartedAt: true,
                aiTrialDays: true,
                aiPlatformKeyAllowed: true,
                aiCustomApiKey: true,
                aiKeyType: true,
                aiKeyStatus: true,
                aiLastKeyTestAt: true,
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const keyResolution = this.aiService.resolveTenantApiKey(tenant);
        const hasCustomKey = Boolean(tenant.aiCustomApiKey);
        const decryptedKey = hasCustomKey ? (0, crypto_util_1.decryptApiKey)(tenant.aiCustomApiKey) : '';
        return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            aiPlatformKeyAllowed: tenant.aiPlatformKeyAllowed,
            canUseAi: keyResolution.canUseAi,
            source: keyResolution.source,
            daysLeft: keyResolution.daysLeft,
            totalTrialDays: keyResolution.totalTrialDays,
            statusText: keyResolution.statusText,
            hasCustomKey,
            maskedCustomKey: decryptedKey ? (0, crypto_util_1.maskApiKey)(decryptedKey) : null,
            lastKeyTestAt: tenant.aiLastKeyTestAt,
            trialStartedAt: tenant.aiTrialStartedAt || tenant.createdAt,
        };
    }
    async togglePlatformKeyAllowed(tenantId, allowed) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, aiPlatformKeyAllowed: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const newAllowed = typeof allowed === 'boolean' ? allowed : !tenant.aiPlatformKeyAllowed;
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                aiPlatformKeyAllowed: newAllowed,
                aiKeyStatus: newAllowed ? 'platform_authorized' : 'trial_active',
            },
        });
        this.logger.log(`[SuperAdmin] Toggle Chave Master para tenant [${tenant.name}]: ${newAllowed ? 'LIBERADA (Modo Teste)' : 'REVOGADA'}`);
        return {
            success: true,
            allowed: newAllowed,
            message: newAllowed
                ? `Chave Master da plataforma LIBERADA com sucesso para '${tenant.name}'. O robô de IA funcionará sem limite de 7 dias para testes.`
                : `Liberação de chave Master revogada para '${tenant.name}'. O tenant voltou a operar sob a política normal de degustação/BYOK.`,
        };
    }
    async superExtendTrial(tenantId, extraDays = 7) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, aiTrialDays: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const updated = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                aiTrialDays: (tenant.aiTrialDays || 7) + extraDays,
                aiTrialStartedAt: new Date(),
                aiKeyStatus: 'trial_active',
            },
        });
        return {
            success: true,
            aiTrialDays: updated.aiTrialDays,
            message: `Período de degustação de '${tenant.name}' renovado por mais ${extraDays} dias com sucesso.`,
        };
    }
    async superSaveAiKey(tenantId, plainKey) {
        return this.saveCustomAiKey(tenantId, plainKey);
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        emails_service_1.EmailsService,
        ai_service_1.AiService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map