import { Controller, Get, Post, Delete, Patch, Put, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { EmailsService } from '../emails/emails.service';
import { encryptApiKey } from '../../shared/utils/crypto.util';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
  ) {}

  @Get()
  async findAll(@Request() req) {
    return this.prisma.user.findMany({
      where: { 
        tenantId: req.user.tenantId,
        isSuperAdmin: false,
        role: { not: 'SUPER_ADMIN' },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        permissions: true,
        avatarUrl: true,
        isOnline: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('me')
  async getMe(@Request() req) {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new BadRequestException('ID de usuário não identificado no token.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        permissions: true,
        avatarUrl: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
            planId: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                hasCRM: true,
                hasWhatsApp: true,
                hasInstagram: true,
                hasAIAgent: true,
                maxUsers: true,
                maxAIMsgs: true,
                maxWorkspaces: true,
                modules: true,
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    const isSuperAdmin = Boolean(user.isSuperAdmin || String(user.role).toUpperCase() === 'SUPER_ADMIN');
    const targetTenantId = req.headers['x-target-tenant-id'] || req.headers['x-tenant-id'];

    if (isSuperAdmin && targetTenantId && typeof targetTenantId === 'string' && targetTenantId !== user.tenantId) {
      const targetTenant = await this.prisma.tenant.findUnique({
        where: { id: targetTenantId },
        select: {
          id: true,
          name: true,
          isActive: true,
          planId: true,
          plan: {
            select: {
              id: true,
              name: true,
              price: true,
              hasCRM: true,
              hasWhatsApp: true,
              hasInstagram: true,
              hasAIAgent: true,
              maxUsers: true,
              maxAIMsgs: true,
              maxWorkspaces: true,
              modules: true,
            },
          },
        },
      });

      if (targetTenant) {
        return {
          ...user,
          tenantId: targetTenant.id,
          tenant: targetTenant,
          isImpersonating: true,
        };
      }
    }

    return user;
  }

  @Patch('profile')
  @Put('profile')
  async updateProfile(@Request() req, @Body() body: { name?: string; avatarUrl?: string }) {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new BadRequestException('ID de usuário não identificado no token.');
    }
    
    const updateData: any = {};
    if (body.name !== undefined) {
      const name = body.name?.trim();
      if (!name) {
        throw new BadRequestException('Nome do usuário é obrigatório.');
      }
      updateData.name = name;
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        tenantId: true,
      },
    });
  }

  @Patch(':id')
  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { name?: string; role?: string; isActive?: boolean; password?: string; avatarUrl?: string; permissions?: any }
  ) {
    const tenantId = req.user?.tenantId;
    const currentUserId = req.user?.id || req.user?.userId;

    const targetUser = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!targetUser) {
      throw new BadRequestException('Usuário não encontrado na sua empresa.');
    }

    const updateData: any = {};

    if (body.name !== undefined) {
      const name = body.name?.trim();
      if (!name) {
        throw new BadRequestException('Nome do usuário é obrigatório.');
      }
      updateData.name = name;
    }

    if (body.role !== undefined) {
      const role = body.role.toUpperCase();
      if (role !== 'ADMIN' && role !== 'AGENT') {
        throw new BadRequestException('Cargo inválido. Utilize ADMIN ou AGENT.');
      }
      // Trava de segurança: não permitir que o único ADMIN remova seu próprio acesso de admin
      if (id === currentUserId && role !== 'ADMIN') {
        const adminCount = await this.prisma.user.count({
          where: { tenantId, role: 'ADMIN', isActive: true },
        });
        if (adminCount <= 1) {
          throw new BadRequestException('Você é o único Administrador ativo da empresa e não pode alterar seu cargo para Atendente.');
        }
      }
      updateData.role = role;
    }

    if (body.permissions !== undefined) {
      updateData.permissions = body.permissions;
    }

    if (body.isActive !== undefined) {
      if (id === currentUserId && body.isActive === false) {
        throw new BadRequestException('Você não pode desativar o seu próprio usuário.');
      }
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.password) {
      const rawPass = body.password.trim();
      if (rawPass.length < 6) {
        throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres.');
      }
      const bcrypt = await import('bcrypt');
      updateData.password = await bcrypt.hash(rawPass, 10);
      updateData.rawPasswordEncrypted = encryptApiKey(rawPass);
    }

    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        avatarUrl: true,
        isOnline: true,
        tenantId: true,
      },
    });

    return {
      message: 'Membro atualizado com sucesso!',
      user: updatedUser,
    };
  }

  @Post()
  async create(
    @Request() req,
    @Body() body: { name: string; email: string; password?: string; role?: string; permissions?: any }
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant não identificado.');

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });
    if (!tenant) throw new BadRequestException('Empresa não encontrada.');

    const maxUsers = tenant.plan?.maxUsers ?? 1;
    const currentUsersCount = await this.prisma.user.count({
      where: { tenantId, isActive: true },
    });

    if (currentUsersCount >= maxUsers) {
      throw new BadRequestException(
        `Limite de operadores atingido: O seu plano ${tenant.plan?.name || 'atual'} permite no máximo ${maxUsers} usuário(s) ativo(s). Faça um upgrade para adicionar novos operadores.`
      );
    }

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    if (!name || !email) {
      throw new BadRequestException('Nome e e-mail são obrigatórios.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Este e-mail já está cadastrado no sistema.');
    }

    const rawPass = body.password?.trim() || 'Versus@123';
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(rawPass, 10);

    const role = (body.role || 'AGENT').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'AGENT';

    const defaultPermissions = {
      inbox: true,
      crm: true,
      chat: true,
      automations: role === 'ADMIN',
      settings: role === 'ADMIN',
      support: true,
    };
    const permissions = body.permissions !== undefined ? body.permissions : defaultPermissions;

    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        rawPasswordEncrypted: encryptApiKey(rawPass),
        role,
        permissions,
        isActive: true,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        avatarUrl: true,
        isOnline: true,
      },
    });

    // Disparo automático de convite via SMTP real do Tenant
    let emailSent = false;
    let emailError: string | undefined;
    try {
      const inviteRes = await this.emailsService.sendUserInvitationEmail({
        tenantId,
        recipientEmail: email,
        recipientName: name,
        role,
        initialPassword: rawPass,
        inviterName: req.user?.name || 'Administrador',
      });
      emailSent = inviteRes.sent;
      emailError = inviteRes.error;
    } catch (err: any) {
      emailError = err.message;
    }

    return {
      message: emailSent
        ? 'Membro cadastrado com sucesso! E-mail de convite enviado via SMTP.'
        : 'Membro cadastrado com sucesso! (Configure o Inbox de E-mails para envio automático de convites).',
      user: newUser,
      emailSent,
      emailError,
    };
  }

  @Delete(':id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    const currentUserId = req.user?.id || req.user?.userId;

    if (id === currentUserId) {
      throw new BadRequestException('Você não pode excluir o seu próprio usuário.');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!targetUser) {
      throw new BadRequestException('Usuário não encontrado na sua empresa.');
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      message: `Usuário '${targetUser.name}' excluído com sucesso.`,
    };
  }
}
