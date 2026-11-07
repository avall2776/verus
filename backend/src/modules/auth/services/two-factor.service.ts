import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import axios from 'axios';
import * as crypto from 'crypto';
import { ClientTelemetry } from '../utils/client-telemetry.util';

export const MASTER_VALIDATION_PHONE = '5554991109159';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera um código de 6 dígitos e despacha para o WhatsApp Master com telemetria completa
   */
  async generateAndSend2FA(
    user: { id: string; name: string; email: string; tenantId: string },
    tenantName: string,
    telemetry: ClientTelemetry,
  ): Promise<{ tempToken: string; expiresAt: Date; maskedPhone: string }> {
    // 1. Gera código numérico de 6 dígitos aleatório
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // 2. Salva no banco de dados
    await this.prisma.twoFactorVerification.create({
      data: {
        userId: user.id,
        email: user.email.toLowerCase(),
        tenantId: user.tenantId,
        code: otpCode,
        tempToken,
        targetPhone: MASTER_VALIDATION_PHONE,
        expiresAt,
      },
    });

    // 3. Monta texto formatado de nível bancário
    const nowBr = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date());

    const message = [
      `🛡️ *[VALLOR SECURITY] - Código de Acesso Bancário*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🏢 *Empresa:* ${tenantName || 'Vallor Omnichannel'}`,
      `👤 *Usuário:* ${user.name} (${user.email})`,
      `📍 *Local:* ${telemetry.city}, ${telemetry.state} (IP: \`${telemetry.ip}\`)`,
      `💻 *Dispositivo:* ${telemetry.browser} no ${telemetry.device}`,
      `⏰ *Horário:* ${nowBr}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔑 Código de Verificação: *${otpCode}*`,
      `⏱️ *Validade:* 10 minutos.`,
      `⚠️ _Se você não reconhece esta tentativa de acesso, bloqueie imediatamente a sessão no painel SuperAdmin._`,
    ].join('\n');

    // 4. Dispara mensagem via WhatsApp Master
    await this.dispatchWhatsAppMaster(user.tenantId, MASTER_VALIDATION_PHONE, message, otpCode);

    const maskedPhone = `(54) 9****-9159`;

    return {
      tempToken,
      expiresAt,
      maskedPhone,
    };
  }

  /**
   * Valida o código de 6 dígitos recebido do frontend
   */
  async verify2FACode(tempToken: string, code: string): Promise<{ userId: string; tenantId: string; email: string }> {
    if (!tempToken || !code) {
      throw new BadRequestException('Token temporário e código de 6 dígitos são obrigatórios.');
    }

    const verification = await this.prisma.twoFactorVerification.findUnique({
      where: { tempToken },
    });

    if (!verification) {
      throw new UnauthorizedException('Sessão de verificação expirada ou inexistente.');
    }

    if (verification.isVerified) {
      throw new UnauthorizedException('Este código já foi utilizado anteriormente.');
    }

    if (new Date() > verification.expiresAt) {
      throw new UnauthorizedException('O código de verificação expirou. Solicite um novo código.');
    }

    if (verification.attempts >= 5) {
      throw new UnauthorizedException('Limite máximo de tentativas excedido. Solicite um novo código.');
    }

    const cleanInputCode = code.trim().replace(/\D/g, '');
    if (cleanInputCode !== verification.code) {
      await this.prisma.twoFactorVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException(`Código de verificação incorreto. Tentativa ${verification.attempts + 1} de 5.`);
    }

    // Sucesso: marca como verificado
    await this.prisma.twoFactorVerification.update({
      where: { id: verification.id },
      data: { isVerified: true },
    });

    return {
      userId: verification.userId,
      tenantId: verification.tenantId,
      email: verification.email,
    };
  }

  /**
   * Envia a mensagem via Evolution API local/remota buscando qualquer instância conectada
   */
  private async dispatchWhatsAppMaster(
    tenantId: string,
    phone: string,
    content: string,
    otpCode: string,
  ): Promise<boolean> {
    try {
      // 1. Procura instância conectada no tenant ou em qualquer tenant do sistema
      let instance = await this.prisma.whatsAppInstance.findFirst({
        where: { tenantId, status: 'connected' },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });

      if (!instance) {
        instance = await this.prisma.whatsAppInstance.findFirst({
          where: { status: 'connected' },
          orderBy: [{ updatedAt: 'desc' }],
        });
      }

      if (!instance) {
        this.logger.warn(
          `[2FA_DISPATCH_WARN] Nenhuma instância de WhatsApp conectada encontrada. Código OTP gerado: ${otpCode} para ${phone}`,
        );
        return false;
      }

      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
      const evolutionGlobalKey = process.env.EVOLUTION_API_KEY || 'verto123';
      const apiKey = instance.token || evolutionGlobalKey;

      const url = `${evolutionUrl}/message/sendText/${instance.name}`;
      const payload = {
        number: phone,
        text: content,
        options: {
          delay: 500,
          presence: 'composing',
          linkPreview: false,
        },
        textMessage: {
          text: content,
        },
      };

      const res = await axios.post(url, payload, {
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      this.logger.log(`[2FA_DISPATCH_SUCCESS] Código enviado com sucesso para ${phone} via instância ${instance.name}`);
      return true;
    } catch (err: any) {
      this.logger.error(`[2FA_DISPATCH_ERROR] Falha ao enviar WhatsApp para ${phone}: ${err.message}. Código: ${otpCode}`);
      // Não trava o processo para permitir fallback/auditoria
      return false;
    }
  }
}

