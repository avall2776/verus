import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    // Se o tenant ainda não tiver workspaces registrados, provisiona o workspace padrão inicial
    const existingCount = await this.prisma.workspace.count({ where: { tenantId } });
    if (existingCount === 0) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      await this.prisma.workspace.create({
        data: {
          name: tenant?.name || 'Workspace Principal',
          description: 'Unidade operacional principal da empresa.',
          logoUrl: tenant?.logoUrl || null,
          themeColor: '#2563EB',
          isDefault: true,
          tenantId,
        },
      });
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    const workspaces = await this.prisma.workspace.findMany({
      where: { tenantId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
      ],
    });

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

  async create(tenantId: string, dto: CreateWorkspaceDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada.');
    }

    const maxWorkspaces = tenant.plan?.maxWorkspaces ?? 1;
    const currentCount = await this.prisma.workspace.count({ where: { tenantId } });

    if (currentCount >= maxWorkspaces) {
      throw new BadRequestException(
        `Limite do plano atingido: O seu plano ${tenant.plan?.name || 'atual'} permite no máximo ${maxWorkspaces} workspace(s). Faça um upgrade para adicionar mais unidades.`
      );
    }

    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('O nome do workspace é obrigatório.');
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

  async update(tenantId: string, id: string, dto: UpdateWorkspaceDto) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, tenantId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado.');
    }

    const updateData: any = {};

    if (dto.name !== undefined) {
      const name = dto.name?.trim();
      if (!name) {
        throw new BadRequestException('O nome do workspace não pode ser vazio.');
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

  async delete(tenantId: string, id: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: { id, tenantId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace não encontrado.');
    }

    if (workspace.isDefault) {
      throw new BadRequestException('Não é permitido remover o Workspace principal da empresa.');
    }

    const count = await this.prisma.workspace.count({ where: { tenantId } });
    if (count <= 1) {
      throw new BadRequestException('A empresa deve possuir no mínimo um workspace ativo.');
    }

    await this.prisma.workspace.delete({ where: { id } });

    return {
      message: `Workspace '${workspace.name}' removido com sucesso.`,
    };
  }
}
