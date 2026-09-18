import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_MODULE_KEY, PlanModuleName } from '../decorators/require-module.decorator';
import { PrismaService } from '../database/prisma.service';

const MODULE_LABELS: Record<PlanModuleName, string> = {
  crm: 'Funil Comercial (CRM)',
  aiAgent: 'Agente de Inteligência Artificial',
  proposalsContracts: 'Propostas Comerciais e Contratos',
  automations: 'Automações de Vendas',
  emailInbox: 'Inbox de E-mail Unificado',
  analytics: 'Analytics e Relatórios Avançados',
  goals: 'Metas Comerciais',
  support: 'Central de Suporte',
  teamChat: 'Chat Interno da Equipe',
  whatsapp: 'WhatsApp & Mensageria',
};

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModules = this.reflector.getAllAndOverride<PlanModuleName[]>(
      REQUIRE_MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se a rota ou controller não exige nenhum módulo específico, libera
    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado no contexto da requisição.');
    }

    // Super Admin tem acesso irrestrito para governança e suporte
    const isSuperAdmin = Boolean(
      user.isSuperAdmin === true ||
      String(user.role).toUpperCase() === 'SUPER_ADMIN' ||
      String(user.role).toUpperCase() === 'SUPERADMIN'
    );
    if (isSuperAdmin) {
      return true;
    }

    // Obtém o plano atual do usuário/tenant
    let plan = user.plan || user.tenant?.plan;

    // Fallback de segurança: busca do banco caso ainda não esteja injetado no req.user
    if (!plan && user.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
        include: { plan: true },
      });
      plan = tenant?.plan;
    }

    if (!plan) {
      throw new ForbiddenException({
        code: 'PLAN_NOT_FOUND',
        message: 'Nenhum plano de assinatura ativo associado a esta empresa.',
      });
    }

    const modules = (plan.modules as Record<string, boolean>) || {};

    for (const mod of requiredModules) {
      const isAllowed = this.checkModuleAllowed(mod, plan, modules);

      if (!isAllowed) {
        const label = MODULE_LABELS[mod] || mod;
        throw new ForbiddenException({
          code: 'PLAN_MODULE_NOT_ALLOWED',
          module: mod,
          planName: plan.name,
          message: `O módulo '${label}' não está disponível no plano atual da sua empresa (${plan.name}). Faça o upgrade de plano para habilitar este recurso.`,
        });
      }
    }

    return true;
  }

  private checkModuleAllowed(mod: PlanModuleName, plan: any, modules: Record<string, boolean>): boolean {
    switch (mod) {
      case 'crm':
        return Boolean(modules.crm ?? plan.hasCRM ?? false);
      case 'aiAgent':
        return Boolean(modules.aiAgent ?? plan.hasAIAgent ?? false);
      case 'whatsapp':
        return Boolean(modules.whatsapp ?? plan.hasWhatsApp ?? true);
      case 'proposalsContracts':
        return Boolean(modules.proposalsContracts ?? false);
      case 'automations':
        return Boolean(modules.automations ?? false);
      case 'emailInbox':
        return Boolean(modules.emailInbox ?? false);
      case 'analytics':
        return Boolean(modules.analytics ?? false);
      case 'goals':
        return Boolean(modules.goals ?? false);
      case 'support':
        return Boolean(modules.support ?? true);
      case 'teamChat':
        return Boolean(modules.teamChat ?? true);
      default:
        return Boolean(modules[mod] ?? false);
    }
  }
}
