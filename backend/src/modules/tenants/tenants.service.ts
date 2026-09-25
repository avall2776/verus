import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { AiService } from '../ai/ai.service';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../../shared/utils/crypto.util';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    public readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly aiService: AiService,
  ) {}

  private evolutionInstancesCache: { data: Map<string, { status: string; owner?: string; profileName?: string }>; expiresAt: number } | null = null;
  private statsCache: { data: any; expiresAt: number } | null = null;

  /**
   * Consulta dinamicamente a Evolution API com cache em memória (TTL: 15s) para evitar atrasos na navegação
   */
  private async getActiveEvolutionInstances(): Promise<Map<string, { status: string; owner?: string; profileName?: string }>> {
    const now = Date.now();
    if (this.evolutionInstancesCache && now < this.evolutionInstancesCache.expiresAt) {
      return this.evolutionInstancesCache.data;
    }

    const instancesMap = new Map<string, { status: string; owner?: string; profileName?: string }>();
    try {
      const serverUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
      const apiKey = process.env.EVOLUTION_API_KEY || 'verto123';

      const res = await axios.get(`${serverUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        timeout: 1500,
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
    } catch (err: any) {
      this.logger.debug(`Consulta à Evolution API ignorada ou offline: ${err.message}`);
    }

    this.evolutionInstancesCache = {
      data: instancesMap,
      expiresAt: now + 15000,
    };

    return instancesMap;
  }

  /**
   * Determina o status real de conexão do WhatsApp para um tenant (Cloud API ou Evolution API)
   */
  private resolveTenantWhatsAppStatus(
    tenant: any,
    liveEvolutionMap: Map<string, { status: string; owner?: string; profileName?: string }>
  ) {
    // 1. WhatsApp Oficial / Cloud API (Meta)
    if (tenant.metaPhoneNumberId && String(tenant.metaPhoneNumberId).trim().length > 5) {
      return {
        connected: true,
        provider: 'meta',
        phone: String(tenant.metaPhoneNumberId),
      };
    }

    // 2. Instâncias vinculadas no banco ou na Evolution API
    const instances = tenant.whatsappInstances || [];
    for (const inst of instances) {
      const dbStatus = String(inst.status || '').toLowerCase().trim();
      const instanceName = (inst.settings as any)?.instanceName || inst.name;
      const liveEvo = instanceName ? liveEvolutionMap.get(instanceName) : null;

      const isLiveOpen = liveEvo && (liveEvo.status === 'open' || liveEvo.status === 'connected');
      const isDbConnected = ['connected', 'open', 'active', 'online'].includes(dbStatus);

      if (isLiveOpen || isDbConnected) {
        return {
          connected: true,
          provider: (inst.settings as any)?.provider || 'evolution',
          phone: inst.phoneNumber || liveEvo?.owner || null,
        };
      }
    }

    // 3. Fallback dinâmico: busca instâncias provisionadas na Evolution API pelo prefixo do tenant
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

  async findAll(query: QueryTenantsDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '10', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status === 'ACTIVE') {
      where.isActive = true;
    } else if (query.status === 'BLOCKED') {
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

    const [tenants, total, liveEvolutionMap] = await Promise.all([
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
      this.getActiveEvolutionInstances(),
    ]);

    // Otimização: agregação em lote de openTickets e deals em consultas paralelas agrupadas
    const tenantIds = tenants.map((t) => t.id);
    const [openTicketsGroup, dealsGroup] = await Promise.all([
      tenantIds.length > 0
        ? this.prisma.supportTicket.groupBy({
            by: ['tenantId'],
            where: {
              tenantId: { in: tenantIds },
              status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] },
            },
            _count: { id: true },
          })
        : [],
      tenantIds.length > 0
        ? this.prisma.deal.groupBy({
            by: ['tenantId'],
            where: {
              tenantId: { in: tenantIds },
            },
            _count: { id: true },
          })
        : [],
    ]);

    const openTicketsMap = new Map<string, number>();
    for (const item of openTicketsGroup) {
      openTicketsMap.set(item.tenantId, item._count.id);
    }

    const dealsMap = new Map<string, number>();
    for (const item of dealsGroup) {
      if (item.tenantId) dealsMap.set(item.tenantId, item._count.id);
    }

    const formatted = tenants.map((tenant) => {
      const openTickets = openTicketsMap.get(tenant.id) || 0;
      const dealsCount = dealsMap.get(tenant.id) || 0;

      const emailSettings = tenant.emailSettings as any;
      const waInfo = this.resolveTenantWhatsAppStatus(tenant, liveEvolutionMap);

      const smtpConfigured = Boolean(
        emailSettings?.isActive ||
        emailSettings?.smtpHost ||
        emailSettings?.resendApiKey
      );

      const firstAdmin = tenant.users[0] || null;
      let adminSavedPassword: string | null = null;
      if (firstAdmin?.rawPasswordEncrypted) {
        try {
          adminSavedPassword = decryptApiKey(firstAdmin.rawPasswordEncrypted);
        } catch {
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
    });

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
    const now = Date.now();
    if (this.statsCache && now < this.statsCache.expiresAt) {
      return this.statsCache.data;
    }

    const [
      totalTenants,
      activeTenants,
      blockedTenants,
      totalUsers,
      totalContracts,
      openTickets,
      tenantsWithPlans,
    ] = await Promise.all([
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

    const statsData = {
      totalTenants,
      activeTenants,
      blockedTenants,
      totalUsers,
      totalContracts,
      openTickets,
      estimatedMRR,
    };

    this.statsCache = {
      data: statsData,
      expiresAt: now + 10000, // Cache de 10s para carregamento instantâneo
    };

    return statsData;
  }

  async findOne(id: string) {
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
      throw new NotFoundException('Empresa não encontrada.');
    }

    // Métricas financeiras e de CRM
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

    const emailSettings = tenant.emailSettings as any;
    const waInfo = this.resolveTenantWhatsAppStatus(tenant, liveEvolutionMap);

    const smtpConfigured = Boolean(
      emailSettings?.isActive ||
      emailSettings?.smtpHost ||
      emailSettings?.resendApiKey
    );

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
        let savedPassword: string | null = null;
        if (u.rawPasswordEncrypted) {
          try {
            savedPassword = decryptApiKey(u.rawPasswordEncrypted);
          } catch {
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

  async updateStatus(id: string, isActive: boolean) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
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

  async resetAdminPassword(id: string, newPassword?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    // Procura admin do tenant, ou o primeiro usuário cadastrado
    const adminUser =
      tenant.users.find((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') ||
      tenant.users[0];

    if (!adminUser) {
      throw new NotFoundException('Nenhum usuário administrador cadastrado nesta empresa.');
    }

    const trimmed = newPassword ? String(newPassword).trim() : '';
    const plainPassword =
      trimmed.length > 0
        ? trimmed
        : `Versus@${Math.floor(100000 + Math.random() * 900000)}`;

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const rawPasswordEncrypted = encryptApiKey(plainPassword);

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

  async getMyTenant(tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant não identificado.');
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
    if (!tenant) throw new NotFoundException('Empresa não encontrada.');
    return tenant;
  }

  async updateMyTenant(tenantId: string, data: { name?: string; cnpj?: string; email?: string; phone?: string; leadNotificationPhone?: string; address?: string; aiEnabled?: boolean }) {
    if (!tenantId) throw new BadRequestException('Tenant não identificado.');
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.cnpj !== undefined) updateData.cnpj = data.cnpj.trim();
    if (data.email !== undefined) updateData.email = data.email.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.leadNotificationPhone !== undefined) updateData.leadNotificationPhone = data.leadNotificationPhone ? data.leadNotificationPhone.trim() : null;
    if (data.address !== undefined) updateData.address = data.address.trim();
    if (data.aiEnabled !== undefined) updateData.aiEnabled = Boolean(data.aiEnabled);

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });
  }

  private async ensureStandardPlans() {
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
      } else if (!existing.modules) {
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

  async createPlan(dto: CreatePlanDto) {
    if (!dto.name || dto.price === undefined) {
      throw new BadRequestException('Nome e preço do plano são obrigatórios.');
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

  async updatePlan(id: string, dto: Partial<CreatePlanDto>) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plano não encontrado.');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.hasCRM !== undefined) data.hasCRM = dto.hasCRM;
    if (dto.hasWhatsApp !== undefined) data.hasWhatsApp = dto.hasWhatsApp;
    if (dto.hasInstagram !== undefined) data.hasInstagram = dto.hasInstagram;
    if (dto.hasAIAgent !== undefined) data.hasAIAgent = dto.hasAIAgent;
    if (dto.maxUsers !== undefined) data.maxUsers = dto.maxUsers;
    if (dto.maxAIMsgs !== undefined) data.maxAIMsgs = dto.maxAIMsgs;
    if (dto.maxWorkspaces !== undefined) data.maxWorkspaces = dto.maxWorkspaces;

    if (dto.modules !== undefined) {
      data.modules = dto.modules;
      if (dto.modules.crm !== undefined) data.hasCRM = Boolean(dto.modules.crm);
      if (dto.modules.whatsapp !== undefined) data.hasWhatsApp = Boolean(dto.modules.whatsapp);
      if (dto.modules.aiAgent !== undefined) data.hasAIAgent = Boolean(dto.modules.aiAgent);
      if (dto.modules.instagram !== undefined) data.hasInstagram = Boolean(dto.modules.instagram);
    }

    return this.prisma.plan.update({
      where: { id },
      data,
    });
  }

  async create(dto: CreateTenantDto) {
    let planId = dto.planId;

    if (!planId && dto.customPlan) {
      const custom = await this.createPlan(dto.customPlan);
      planId = custom.id;
    }

    if (!planId) {
      await this.ensureStandardPlans();
      const firstPlan = await this.prisma.plan.findFirst({ orderBy: { price: 'asc' } });
      if (!firstPlan) throw new BadRequestException('Nenhum plano disponível.');
      planId = firstPlan.id;
    }

    // Validar se e-mail de admin já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase().trim() },
    });
    if (existingUser) {
      throw new BadRequestException('Já existe um usuário cadastrado com este e-mail.');
    }

    const rawAdminPass = dto.adminPassword?.trim() || 'Versus@123456';
    const hashedPassword = await bcrypt.hash(rawAdminPass, 10);
    const rawPasswordEncrypted = encryptApiKey(rawAdminPass);

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

  async update(id: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name ? String(dto.name).trim() : '';
    if (dto.cnpj !== undefined) data.cnpj = dto.cnpj ? String(dto.cnpj).trim() : null;
    if (dto.email !== undefined) data.email = dto.email ? String(dto.email).trim() : null;
    if (dto.phone !== undefined) data.phone = dto.phone ? String(dto.phone).trim() : null;
    if (dto.leadNotificationPhone !== undefined) data.leadNotificationPhone = dto.leadNotificationPhone ? String(dto.leadNotificationPhone).trim() : null;
    if (dto.address !== undefined) data.address = dto.address ? String(dto.address).trim() : null;
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl ? String(dto.logoUrl).trim() : null;
    if (dto.isActive !== undefined) data.isActive = Boolean(dto.isActive);
    if (dto.aiEnabled !== undefined) data.aiEnabled = Boolean(dto.aiEnabled);

    if (dto.planId) {
      const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
      if (!plan) {
        throw new BadRequestException('Plano informado não existe.');
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

  /**
   * Atualiza dados de um usuário/operador pertencente a um tenant específico (Super Admin).
   */
  async updateTenantUser(
    tenantId: string,
    userId: string,
    dto: { name?: string; email?: string; role?: string; isActive?: boolean }
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado nesta empresa.');
    }

    const data: any = {};

    if (dto.name !== undefined) {
      const name = dto.name?.trim();
      if (!name) {
        throw new BadRequestException('O nome do usuário não pode ficar vazio.');
      }
      data.name = name;
    }

    if (dto.email !== undefined) {
      const email = dto.email?.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        throw new BadRequestException('E-mail informado é inválido.');
      }

      const existing = await this.prisma.user.findFirst({
        where: { email, id: { not: userId } },
      });

      if (existing) {
        throw new BadRequestException('Este e-mail já está sendo utilizado por outro usuário no sistema.');
      }

      data.email = email;
    }

    if (dto.role !== undefined) {
      const role = dto.role.toUpperCase();
      if (role !== 'ADMIN' && role !== 'AGENT') {
        throw new BadRequestException('Papel inválido. Escolha ADMIN ou AGENT.');
      }
      data.role = role;
    }

    if (dto.isActive !== undefined) {
      data.isActive = Boolean(dto.isActive);
    }

    if ((dto as any).password && String((dto as any).password).trim()) {
      const p = String((dto as any).password).trim();
      data.password = await bcrypt.hash(p, 10);
      data.rawPasswordEncrypted = encryptApiKey(p);
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

  /**
   * Redefine a senha de um operador do tenant e opcionalmente dispara e-mail via SMTP real.
   */
  async resetTenantUserPassword(
    tenantId: string,
    userId: string,
    dto: { newPassword?: string; sendEmail?: boolean }
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado nesta empresa.');
    }

    const trimmed = dto.newPassword ? String(dto.newPassword).trim() : '';
    const plainPassword =
      trimmed.length > 0
        ? trimmed
        : `Versus@${Math.floor(100000 + Math.random() * 900000)}`;

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const rawPasswordEncrypted = encryptApiKey(plainPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        rawPasswordEncrypted,
      },
    });

    let emailSent = false;
    let emailError: string | undefined;

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
      } catch (err: any) {
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

  /**
   * Exclui com segurança um usuário do tenant no banco de dados (Prisma/Supabase).
   * Desassocia dependências de tickets e CRM antes da remoção definitiva.
   */
  async deleteTenantUser(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado nesta empresa.');
    }

    if (user.isSuperAdmin || user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Usuários com permissão de Super Admin não podem ser excluídos por este painel.');
    }

    // 1. Desvincular leads / deals
    await this.prisma.deal.updateMany({
      where: { assignedTo: userId },
      data: { assignedTo: null },
    });

    // 2. Limpar associações de departamentos
    await this.prisma.userDepartment.deleteMany({
      where: { userId },
    });

    // 3. Desvincular metas
    await this.prisma.goal.updateMany({
      where: { userId },
      data: { userId: null },
    });

    // 4. Desvincular chamados de suporte (criador e responsável)
    await this.prisma.supportTicket.updateMany({
      where: { userId },
      data: { userId: null },
    });
    await this.prisma.supportTicket.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null },
    });

    // 5. Desvincular mensagens de chamados
    await this.prisma.ticketMessage.updateMany({
      where: { senderId: userId },
      data: { senderId: null },
    });

    // 6. Remover mensagens internas da equipe
    await this.prisma.teamMessage.deleteMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });

    // 7. Remoção definitiva do usuário
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      success: true,
      message: `Usuário '${user.name}' (${user.email}) removido permanentemente com sucesso do banco de dados.`,
    };
  }

  // --------------------------------------------------------------------------
  // TRANSIÇÃO HÍBRIDA DE CHAVES OPENAI (BYOK, TRIAL 7 DIAS & SUPER ADMIN BYPASS)
  // --------------------------------------------------------------------------

  /**
   * Retorna o status detalhado de IA para o Tenant logado
   */
  async getAiStatus(tenantId: string) {
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
      throw new NotFoundException('Empresa não encontrada.');
    }

    const keyResolution = this.aiService.resolveTenantApiKey(tenant);
    const hasCustomKey = Boolean(tenant.aiCustomApiKey && tenant.aiCustomApiKey.trim().length > 0);
    const decryptedKey = hasCustomKey ? decryptApiKey(tenant.aiCustomApiKey!) : '';
    const maskedCustomKey = decryptedKey ? maskApiKey(decryptedKey) : null;

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

  /**
   * Testa a conectividade de uma chave informada pelo cliente ou a chave salva no banco
   */
  async testClientAiKey(tenantId: string, apiKey?: string) {
    let keyToTest = apiKey?.trim();

    if (!keyToTest) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { aiCustomApiKey: true },
      });

      if (!tenant?.aiCustomApiKey) {
        throw new BadRequestException('Nenhuma chave própria cadastrada para testar. Digite uma chave para testar.');
      }

      keyToTest = decryptApiKey(tenant.aiCustomApiKey);
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

  /**
   * Valida, testa, criptografa e salva a chave própria da OpenAI do cliente (BYOK)
   */
  async saveCustomAiKey(tenantId: string, plainKey: string) {
    const trimmed = (plainKey || '').trim();
    if (!trimmed || trimmed.length < 15) {
      throw new BadRequestException('Chave da OpenAI inválida. Formato esperado: sk-...');
    }

    // 1. Testa na OpenAI antes de salvar para garantir que a chave é funcional e tem créditos
    this.logger.log(`Validando chave OpenAI fornecida pelo tenant [${tenantId}]...`);
    const testResult = await this.aiService.testApiKey(trimmed);
    if (!testResult.success) {
      throw new BadRequestException(
        `Não foi possível ativar esta chave: ${testResult.message || testResult.error}`
      );
    }

    // 2. Criptografa com chave AES-256
    const encrypted = encryptApiKey(trimmed);

    // 3. Atualiza tenant
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
      maskedKey: maskApiKey(trimmed),
    };
  }

  /**
   * Remove a chave própria do cliente e retorna para a degustação da plataforma
   */
  async removeCustomAiKey(tenantId: string) {
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

  // --------------------------------------------------------------------------
  // GOVERNANÇA SUPER ADMIN (BYPASS DO SISTEMA & MODO TESTE)
  // --------------------------------------------------------------------------

  /**
   * Consulta status de IA e chave para o Super Admin
   */
  async getSuperTenantAi(tenantId: string) {
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
      throw new NotFoundException('Empresa não encontrada.');
    }

    const keyResolution = this.aiService.resolveTenantApiKey(tenant);
    const hasCustomKey = Boolean(tenant.aiCustomApiKey);
    const decryptedKey = hasCustomKey ? decryptApiKey(tenant.aiCustomApiKey!) : '';

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
      maskedCustomKey: decryptedKey ? maskApiKey(decryptedKey) : null,
      lastKeyTestAt: tenant.aiLastKeyTestAt,
      trialStartedAt: tenant.aiTrialStartedAt || tenant.createdAt,
    };
  }

  /**
   * Toggle do Super Admin: Libera ou revoga o uso da chave Master da plataforma para testes contínuos
   */
  async togglePlatformKeyAllowed(tenantId: string, allowed?: boolean) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, aiPlatformKeyAllowed: true },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const newAllowed = typeof allowed === 'boolean' ? allowed : !tenant.aiPlatformKeyAllowed;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiPlatformKeyAllowed: newAllowed,
        aiKeyStatus: newAllowed ? 'platform_authorized' : 'trial_active',
      },
    });

    this.logger.log(
      `[SuperAdmin] Toggle Chave Master para tenant [${tenant.name}]: ${newAllowed ? 'LIBERADA (Modo Teste)' : 'REVOGADA'}`
    );

    return {
      success: true,
      allowed: newAllowed,
      message: newAllowed
        ? `Chave Master da plataforma LIBERADA com sucesso para '${tenant.name}'. O robô de IA funcionará sem limite de 7 dias para testes.`
        : `Liberação de chave Master revogada para '${tenant.name}'. O tenant voltou a operar sob a política normal de degustação/BYOK.`,
    };
  }

  /**
   * Super Admin: Estende ou renova o período de degustação em N dias
   */
  async superExtendTrial(tenantId: string, extraDays: number = 7) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, aiTrialDays: true },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiTrialDays: (tenant.aiTrialDays || 7) + extraDays,
        aiTrialStartedAt: new Date(), // reinicia a contagem a partir de agora
        aiKeyStatus: 'trial_active',
      },
    });

    return {
      success: true,
      aiTrialDays: updated.aiTrialDays,
      message: `Período de degustação de '${tenant.name}' renovado por mais ${extraDays} dias com sucesso.`,
    };
  }

  /**
   * Super Admin: Injeta uma chave OpenAI específica para o tenant
   */
  async superSaveAiKey(tenantId: string, plainKey: string) {
    return this.saveCustomAiKey(tenantId, plainKey);
  }
}

