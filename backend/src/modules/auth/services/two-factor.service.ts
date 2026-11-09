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
  ): Promise<{ tempToken: string; expiresAt: Date; maskedPhone: string; code: string }> {
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

    const mapsLocation = telemetry.city
      ? encodeURIComponent(`${telemetry.city}, ${telemetry.state || 'RS'}, Brasil`)
      : encodeURIComponent(`${telemetry.ip}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsLocation}`;

    const message = [
      `🔐 *[VALLOR SECURITY] · Autorização de Acesso*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Usuário Solicitante:* *${user.name || 'Operador'}*`,
      `📧 *E-mail de Login:* *${user.email}*`,
      `🏢 *Empresa / Tenant:* ${tenantName || 'Vallor Omnichannel'}`,
      `📍 *Local:* ${telemetry.city || 'Desconhecido'}, ${telemetry.state || 'BR'} (IP: \`${telemetry.ip || '0.0.0.0'}\`)`,
      `🗺️ *Ver no Maps:* ${mapsUrl}`,
      `💻 *Dispositivo:* ${telemetry.browser || 'Navegador'} no ${telemetry.device || 'Desktop/Mobile'}`,
      `⏰ *Horário:* ${nowBr}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔑 *SEU CÓDIGO DE AUTORIZAÇÃO:*`,
      `👉 *${otpCode}*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `⏱️ *Validade:* 10 minutos.`,
      `⚠️ *Atenção:* Se você não autoriza este acesso ou não reconhece o usuário acima, não repasse este código.`,
    ].join('\n');

    // 4. Dispara mensagem via WhatsApp Master
    await this.dispatchWhatsAppMaster(user.tenantId, MASTER_VALIDATION_PHONE, message, otpCode);

    const maskedPhone = `(54) 9****-9159`;

    return {
      tempToken,
      expiresAt,
      maskedPhone,
      code: otpCode,
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
   * Envia a mensagem via Evolution API local/remota buscando qualquer instância conectada com chave mestra
   */
  private async dispatchWhatsAppMaster(
    tenantId: string,
    phone: string,
    content: string,
    otpCode: string,
  ): Promise<boolean> {
    try {
      const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
      const evolutionGlobalKey = process.env.EVOLUTION_API_KEY || 'verto123';

      // Normaliza para o padrão de 12 dígitos do WhatsApp no Brasil (DDD >= 31 no Baileys)
      const cleanDigits = phone.replace(/\D/g, '');
      const targetPhone12 = cleanDigits.length === 13 && cleanDigits.startsWith('55')
        ? cleanDigits.slice(0, 4) + cleanDigits.slice(5) // Remove 9º dígito: 555491109159
        : cleanDigits;

      const payload = {
        number: targetPhone12,
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

      // 1. Procura instâncias conectadas (priorizando linhas que não sejam o próprio destinatário)
      const candidateInstances = await this.prisma.whatsAppInstance.findMany({
        where: { status: 'connected' },
        orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      });

      if (!candidateInstances || candidateInstances.length === 0) {
        this.logger.warn(
          `[2FA_DISPATCH_WARN] Nenhuma instância de WhatsApp conectada encontrada. Código OTP gerado: ${otpCode} para ${phone}`,
        );
        return false;
      }

      // Ordena priorizando a linha oficial da Avall Marketing e Vendas como remetente número 1
      candidateInstances.sort((a, b) => {
        const aIsAvall = a.phoneNumber?.includes('96283090') || a.name?.toLowerCase().includes('avall') ? 1 : 0;
        const bIsAvall = b.phoneNumber?.includes('96283090') || b.name?.toLowerCase().includes('avall') ? 1 : 0;
        if (aIsAvall !== bIsAvall) return bIsAvall - aIsAvall; // Avall primeiro

        const aIsDest = a.phoneNumber?.includes('91109159') ? 1 : 0;
        const bIsDest = b.phoneNumber?.includes('91109159') ? 1 : 0;
        return aIsDest - bIsDest;
      });

      // 2. Itera sobre as instâncias conectadas e tenta o envio com a chave mestra global da Evolution API
      for (const inst of candidateInstances) {
        let evoInstanceName = (inst?.settings as any)?.instanceName;
        if (!evoInstanceName || !evoInstanceName.startsWith('versus_')) {
          if (inst?.name && inst.name.startsWith('versus_')) {
            evoInstanceName = inst.name.trim();
          } else {
            const shortTenant = inst.tenantId ? inst.tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : 'ten';
            const shortInst = inst.id ? inst.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : 'inst';
            evoInstanceName = `versus_${shortTenant}_${shortInst}`;
          }
        }

        const url = `${evolutionUrl}/message/sendText/${evoInstanceName}`;
        // Prioridade soberana para a chave mestra global (verto123) que a Evolution API exige
        const keysToTry = Array.from(new Set([evolutionGlobalKey, 'verto123', inst.token])).filter(Boolean) as string[];

        for (const key of keysToTry) {
          try {
            await axios.post(url, payload, {
              headers: {
                apikey: key,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            });

            this.logger.log(
              `[2FA_DISPATCH_SUCCESS] Código enviado com sucesso para ${targetPhone12} via instância ${evoInstanceName}`,
            );
            return true;
          } catch (sendErr: any) {
            this.logger.warn(
              `[2FA_DISPATCH_ATTEMPT_FAILED] Tentativa via ${evoInstanceName} falhou: ${sendErr.message}`,
            );
          }
        }
      }

      this.logger.error(
        `[2FA_DISPATCH_ERROR] Todas as tentativas de envio falharam para ${phone}. Código: ${otpCode}`,
      );
      return false;
    } catch (err: any) {
      this.logger.error(
        `[2FA_DISPATCH_ERROR] Falha geral ao enviar WhatsApp para ${phone}: ${err.message}. Código: ${otpCode}`,
      );
      return false;
    }
  }
}

