import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiTokensService {
  private readonly logger = new Logger(ApiTokensService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todos os tokens do tenant
   */
  async listTokens(tenantId: string) {
    return this.prisma.apiToken.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        isActive: true,
        lastUsedAt: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cria um novo token para integrações
   */
  async createToken(tenantId: string, name: string, permissions: any, createdBy?: string) {
    if (!name || !name.trim()) {
      throw new BadRequestException('Informe um nome descritivo para o Token de API (ex: "Meta Ads - Tráfego Pago").');
    }

    // Gera token criptográfico único com prefixo seguro
    const randomHex = crypto.randomBytes(24).toString('hex');
    const rawToken = `vrs_live_${randomHex}`;
    const tokenPrefix = `vrs_live_${randomHex.substring(0, 4)}...${randomHex.slice(-4)}`;

    const tokenRecord = await this.prisma.apiToken.create({
      data: {
        tenantId,
        name: name.trim(),
        token: rawToken,
        tokenPrefix,
        permissions: permissions || { leads: true, contacts: true, deals: true },
        isActive: true,
        createdBy: createdBy || 'Administrador',
      },
    });

    this.logger.log(`Novo token de API criado para tenant [${tenantId}]: "${name}"`);

    return {
      success: true,
      message: 'Token de API gerado com sucesso.',
      token: rawToken, // Retornado em texto puro apenas no momento da criação!
      data: {
        id: tokenRecord.id,
        name: tokenRecord.name,
        tokenPrefix: tokenRecord.tokenPrefix,
        isActive: tokenRecord.isActive,
        createdAt: tokenRecord.createdAt,
      },
    };
  }

  /**
   * Alterna status do token (Ativo / Inativo)
   */
  async toggleToken(tenantId: string, id: string) {
    const existing = await this.prisma.apiToken.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Token de API não encontrado.');
    }

    const updated = await this.prisma.apiToken.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return {
      success: true,
      message: updated.isActive ? 'Token ativado com sucesso.' : 'Token desativado com sucesso.',
      data: updated,
    };
  }

  /**
   * Exclui / Revoga permanentemente o token
   */
  async deleteToken(tenantId: string, id: string) {
    const existing = await this.prisma.apiToken.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Token de API não encontrado.');
    }

    await this.prisma.apiToken.delete({
      where: { id },
    });

    this.logger.log(`Token de API revogado [${id}] para tenant [${tenantId}]`);

    return {
      success: true,
      message: 'Token de API revogado e excluído com sucesso.',
    };
  }
}
