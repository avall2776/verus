import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.contract.findMany({
      where: { tenantId },
      include: {
        proposal: {
          include: {
            lead: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, tenantId },
      include: {
        proposal: {
          include: {
            lead: true,
            deal: true,
            items: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contrato não encontrado');
    }

    return contract;
  }

  async create(tenantId: string, dto: CreateContractDto) {
    // Validate proposal belongs to tenant
    const proposal = await this.prisma.proposal.findFirst({
      where: { id: dto.proposalId, tenantId },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta vinculada não encontrada no tenant');
    }

    return this.prisma.contract.create({
      data: {
        tenantId,
        proposalId: dto.proposalId,
        status: dto.status || 'PENDING_SIGNATURE',
        documentUrl: dto.documentUrl || null,
        auditLogUrl: dto.auditLogUrl || null,
      },
      include: {
        proposal: {
          include: {
            lead: true,
            items: true,
          },
        },
      },
    });
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateContractStatusDto) {
    const contract = await this.findOne(tenantId, id);

    const data: any = {
      status: dto.status,
    };

    if (dto.status === 'SIGNED' && !contract.signedAt) {
      data.signedAt = new Date();
    }
    if (dto.documentUrl) {
      data.documentUrl = dto.documentUrl;
    }
    if (dto.auditLogUrl) {
      data.auditLogUrl = dto.auditLogUrl;
    }

    return this.prisma.contract.update({
      where: { id: contract.id },
      data,
      include: {
        proposal: {
          include: {
            lead: true,
            items: true,
          },
        },
      },
    });
  }
}
