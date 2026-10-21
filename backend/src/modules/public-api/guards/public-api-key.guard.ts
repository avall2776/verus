import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class PublicApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(PublicApiKeyGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extração do Token do Header
    const authHeader = request.headers['authorization'] || '';
    const xApiKey = request.headers['x-api-key'] || request.headers['x-token'] || '';

    let token = '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof xApiKey === 'string' && xApiKey.trim()) {
      token = xApiKey.trim();
    } else if (typeof request.query?.api_key === 'string' && request.query.api_key.trim()) {
      token = request.query.api_key.trim();
    }

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        code: 'MISSING_API_KEY',
        message: 'Chave de API não fornecida. Envie o cabeçalho Authorization: Bearer <TOKEN> ou x-api-key: <TOKEN>.',
        help: 'Gere um token em Configurações > APIs no painel VERSUS.'
      });
    }

    // 2. Busca e Validação do Token no Banco
    const apiToken = await this.prisma.apiToken.findUnique({
      where: { token },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
          }
        }
      }
    });

    if (!apiToken || !apiToken.isActive) {
      throw new UnauthorizedException({
        success: false,
        code: 'INVALID_API_KEY',
        message: 'Chave de API inválida ou revogada.',
      });
    }

    if (!apiToken.tenant || !apiToken.tenant.isActive) {
      throw new ForbiddenException({
        success: false,
        code: 'TENANT_INACTIVE',
        message: 'A empresa vinculada a esta chave de API está inativa ou bloqueada.',
      });
    }

    // 3. Atualização assíncrona do último uso (sem travar a requisição)
    this.prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() }
    }).catch(err => this.logger.warn(`Falha ao registrar lastUsedAt para token ${apiToken.id}: ${err.message}`));

    // 4. Injeção segura no Request para consumo pelos controllers
    request.tenantId = apiToken.tenantId;
    request.tenant = apiToken.tenant;
    request.apiToken = apiToken;

    return true;
  }
}
