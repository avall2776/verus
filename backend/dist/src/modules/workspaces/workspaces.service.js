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
exports.WorkspacesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let WorkspacesService = class WorkspacesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(tenantId) {
        let [workspaces, tenant] = await Promise.all([
            this.prisma.workspace.findMany({
                where: { tenantId },
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'asc' },
                ],
            }),
            this.prisma.tenant.findUnique({
                where: { id: tenantId },
                include: { plan: true },
            }),
        ]);
        if (workspaces.length === 0) {
            const defaultWorkspace = await this.prisma.workspace.create({
                data: {
                    name: tenant?.name || 'Workspace Principal',
                    description: 'Unidade operacional principal da empresa.',
                    logoUrl: tenant?.logoUrl || null,
                    themeColor: '#2563EB',
                    isDefault: true,
                    tenantId,
                },
            });
            workspaces = [defaultWorkspace];
        }
        const maxWorkspaces = tenant?.plan?.maxWorkspaces ?? 1;
        return {
            workspaces,
            metrics: {
                total: workspaces.length,
                max: maxWorkspaces,
                available: Math.max(0, maxWorkspaces - workspaces.length),
                isLimitReached: workspaces.length >= maxWorkspaces,
                planName: tenant?.plan?.name || 'Padrão',
            },
        };
    }
    async create(tenantId, dto) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: { plan: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Empresa não encontrada.');
        }
        const maxWorkspaces = tenant.plan?.maxWorkspaces ?? 1;
        const currentCount = await this.prisma.workspace.count({ where: { tenantId } });
        if (currentCount >= maxWorkspaces) {
            throw new common_1.BadRequestException(`Limite do plano atingido: O seu plano ${tenant.plan?.name || 'atual'} permite no máximo ${maxWorkspaces} workspace(s). Faça um upgrade para adicionar mais unidades.`);
        }
        const name = dto.name?.trim();
        if (!name) {
            throw new common_1.BadRequestException('O nome do workspace é obrigatório.');
        }
        const workspace = await this.prisma.workspace.create({
            data: {
                name,
                description: dto.description?.trim() || null,
                logoUrl: dto.logoUrl || null,
                themeColor: dto.themeColor || '#2563EB',
                isDefault: false,
                tenantId,
            },
        });
        return {
            message: 'Workspace criado com sucesso!',
            workspace,
        };
    }
    async update(tenantId, id, dto) {
        const workspace = await this.prisma.workspace.findFirst({
            where: { id, tenantId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace não encontrado.');
        }
        const updateData = {};
        if (dto.name !== undefined) {
            const name = dto.name?.trim();
            if (!name) {
                throw new common_1.BadRequestException('O nome do workspace não pode ser vazio.');
            }
            updateData.name = name;
        }
        if (dto.description !== undefined) {
            updateData.description = dto.description?.trim() || null;
        }
        if (dto.logoUrl !== undefined) {
            updateData.logoUrl =
                dto.logoUrl && typeof dto.logoUrl === 'string' && dto.logoUrl.trim()
                    ? dto.logoUrl.trim()
                    : null;
        }
        if (dto.themeColor !== undefined) {
            updateData.themeColor = dto.themeColor || '#2563EB';
        }
        const updated = await this.prisma.workspace.update({
            where: { id },
            data: updateData,
        });
        return {
            message: 'Workspace atualizado com sucesso!',
            workspace: updated,
        };
    }
    async delete(tenantId, id) {
        const workspace = await this.prisma.workspace.findFirst({
            where: { id, tenantId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace não encontrado.');
        }
        if (workspace.isDefault) {
            throw new common_1.BadRequestException('Não é permitido remover o Workspace principal da empresa.');
        }
        const count = await this.prisma.workspace.count({ where: { tenantId } });
        if (count <= 1) {
            throw new common_1.BadRequestException('A empresa deve possuir no mínimo um workspace ativo.');
        }
        await this.prisma.workspace.delete({ where: { id } });
        return {
            message: `Workspace '${workspace.name}' removido com sucesso.`,
        };
    }
};
exports.WorkspacesService = WorkspacesService;
exports.WorkspacesService = WorkspacesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkspacesService);
//# sourceMappingURL=workspaces.service.js.map