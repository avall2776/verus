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
exports.PlanGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const require_module_decorator_1 = require("../decorators/require-module.decorator");
const prisma_service_1 = require("../database/prisma.service");
const MODULE_LABELS = {
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
let PlanGuard = class PlanGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const requiredModules = this.reflector.getAllAndOverride(require_module_decorator_1.REQUIRE_MODULE_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredModules || requiredModules.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não autenticado no contexto da requisição.');
        }
        const isSuperAdmin = Boolean(user.isSuperAdmin === true ||
            String(user.role).toUpperCase() === 'SUPER_ADMIN' ||
            String(user.role).toUpperCase() === 'SUPERADMIN');
        if (isSuperAdmin) {
            return true;
        }
        let plan = user.plan || user.tenant?.plan;
        if (!plan && user.tenantId) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: user.tenantId },
                include: { plan: true },
            });
            plan = tenant?.plan;
        }
        if (!plan) {
            throw new common_1.ForbiddenException({
                code: 'PLAN_NOT_FOUND',
                message: 'Nenhum plano de assinatura ativo associado a esta empresa.',
            });
        }
        const modules = plan.modules || {};
        for (const mod of requiredModules) {
            const isAllowed = this.checkModuleAllowed(mod, plan, modules);
            if (!isAllowed) {
                const label = MODULE_LABELS[mod] || mod;
                throw new common_1.ForbiddenException({
                    code: 'PLAN_MODULE_NOT_ALLOWED',
                    module: mod,
                    planName: plan.name,
                    message: `O módulo '${label}' não está disponível no plano atual da sua empresa (${plan.name}). Faça o upgrade de plano para habilitar este recurso.`,
                });
            }
        }
        return true;
    }
    checkModuleAllowed(mod, plan, modules) {
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
};
exports.PlanGuard = PlanGuard;
exports.PlanGuard = PlanGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], PlanGuard);
//# sourceMappingURL=plan.guard.js.map