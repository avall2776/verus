import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Calcular tickets pendentes e deals por tenant
    const formatted = await Promise.all(
      tenants.map(async (tenant) => {
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

        const emailSettings = tenant.emailSettings as any;
        const whatsappConnected = Boolean(
          tenant.metaPhoneNumberId ||
          tenant.whatsappInstances.some((inst) => inst.status === 'CONNECTED') ||
          (tenant.whatsappSettings as any)?.antiBanEnabled !== undefined
        );

        const smtpConfigured = Boolean(
          emailSettings?.isActive ||
          emailSettings?.smtpHost ||
          emailSettings?.resendApiKey
        );

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
      })
    );

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

    const signedContractsSummary = await this.prisma.contract.aggregate({
      where: { tenantId: id, status: 'SIGNED' },
      _count: { id: true },
      _sum: { value: true },
    });

    const emailSettings = tenant.emailSettings as any;
    const whatsappConnected = Boolean(
      tenant.metaPhoneNumberId ||
      tenant.whatsappInstances.some((inst) => inst.status === 'CONNECTED') ||
      (tenant.whatsappSettings as any)?.antiBanEnabled !== undefined
    );

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

    const plainPassword =
      newPassword && newPassword.trim().length >= 6
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

  async updateMyTenant(tenantId: string, data: { name?: string; cnpj?: string; email?: string; phone?: string; address?: string }) {
    if (!tenantId) throw new BadRequestException('Tenant não identificado.');
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.cnpj !== undefined) updateData.cnpj = data.cnpj.trim();
    if (data.email !== undefined) updateData.email = data.email.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.address !== undefined) updateData.address = data.address.trim();

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
      },
    ];

    for (const dp of defaultPlans) {
      const exists = await this.prisma.plan.findFirst({
        where: { name: { equals: dp.name, mode: 'insensitive' } },
      });
      if (!exists) {
        await this.prisma.plan.create({ data: dp });
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
    const created = await this.prisma.plan.create({
      data: {
        name: dto.name.trim(),
        price: dto.price,
        hasCRM: dto.hasCRM ?? false,
        hasWhatsApp: dto.hasWhatsApp ?? true,
        hasInstagram: dto.hasInstagram ?? false,
        hasAIAgent: dto.hasAIAgent ?? false,
        maxUsers: dto.maxUsers ?? 1,
        maxAIMsgs: dto.maxAIMsgs ?? 0,
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

  async update(id: string, dto: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.cnpj !== undefined) data.cnpj = dto.cnpj.trim();
    if (dto.email !== undefined) data.email = dto.email.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl ? dto.logoUrl.trim() : null;
    if (dto.isActive !== undefined) data.isActive = Boolean(dto.isActive);

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
}
