import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedSecret = request.headers['x-webhook-secret'];
    const expectedSecret = this.configService.get<string>('WEBHOOK_SECRET');

    if (!expectedSecret) {
      // Falha de segurança se não houver segredo configurado
      throw new UnauthorizedException('Servidor não configurado para aceitar webhooks com segurança.');
    }

    if (providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Falha de autenticação do Webhook.');
    }

    return true;
  }
}
