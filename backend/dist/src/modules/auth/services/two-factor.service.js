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
var TwoFactorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = exports.MASTER_VALIDATION_PHONE = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const axios_1 = require("axios");
const crypto = require("crypto");
exports.MASTER_VALIDATION_PHONE = '5554991109159';
let TwoFactorService = TwoFactorService_1 = class TwoFactorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(TwoFactorService_1.name);
    }
    async generateAndSend2FA(user, tenantName, telemetry) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const tempToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.prisma.twoFactorVerification.create({
            data: {
                userId: user.id,
                email: user.email.toLowerCase(),
                tenantId: user.tenantId,
                code: otpCode,
                tempToken,
                targetPhone: exports.MASTER_VALIDATION_PHONE,
                expiresAt,
            },
        });
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
        await this.dispatchWhatsAppMaster(user.tenantId, exports.MASTER_VALIDATION_PHONE, message, otpCode);
        const maskedPhone = `(54) 9****-9159`;
        return {
            tempToken,
            expiresAt,
            maskedPhone,
        };
    }
    async verify2FACode(tempToken, code) {
        if (!tempToken || !code) {
            throw new common_1.BadRequestException('Token temporário e código de 6 dígitos são obrigatórios.');
        }
        const verification = await this.prisma.twoFactorVerification.findUnique({
            where: { tempToken },
        });
        if (!verification) {
            throw new common_1.UnauthorizedException('Sessão de verificação expirada ou inexistente.');
        }
        if (verification.isVerified) {
            throw new common_1.UnauthorizedException('Este código já foi utilizado anteriormente.');
        }
        if (new Date() > verification.expiresAt) {
            throw new common_1.UnauthorizedException('O código de verificação expirou. Solicite um novo código.');
        }
        if (verification.attempts >= 5) {
            throw new common_1.UnauthorizedException('Limite máximo de tentativas excedido. Solicite um novo código.');
        }
        const cleanInputCode = code.trim().replace(/\D/g, '');
        if (cleanInputCode !== verification.code) {
            await this.prisma.twoFactorVerification.update({
                where: { id: verification.id },
                data: { attempts: { increment: 1 } },
            });
            throw new common_1.UnauthorizedException(`Código de verificação incorreto. Tentativa ${verification.attempts + 1} de 5.`);
        }
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
    async dispatchWhatsAppMaster(tenantId, phone, content, otpCode) {
        try {
            const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
            const evolutionGlobalKey = process.env.EVOLUTION_API_KEY || 'verto123';
            const cleanDigits = phone.replace(/\D/g, '');
            const targetPhone12 = cleanDigits.length === 13 && cleanDigits.startsWith('55')
                ? cleanDigits.slice(0, 4) + cleanDigits.slice(5)
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
            const candidateInstances = await this.prisma.whatsAppInstance.findMany({
                where: { status: 'connected' },
                orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
            });
            if (!candidateInstances || candidateInstances.length === 0) {
                this.logger.warn(`[2FA_DISPATCH_WARN] Nenhuma instância de WhatsApp conectada encontrada. Código OTP gerado: ${otpCode} para ${phone}`);
                return false;
            }
            candidateInstances.sort((a, b) => {
                const aIsDest = a.phoneNumber?.includes('91109159') ? 1 : 0;
                const bIsDest = b.phoneNumber?.includes('91109159') ? 1 : 0;
                return aIsDest - bIsDest;
            });
            for (const inst of candidateInstances) {
                let evoInstanceName = inst?.settings?.instanceName;
                if (!evoInstanceName || !evoInstanceName.startsWith('versus_')) {
                    if (inst?.name && inst.name.startsWith('versus_')) {
                        evoInstanceName = inst.name.trim();
                    }
                    else {
                        const shortTenant = inst.tenantId ? inst.tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : 'ten';
                        const shortInst = inst.id ? inst.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : 'inst';
                        evoInstanceName = `versus_${shortTenant}_${shortInst}`;
                    }
                }
                const url = `${evolutionUrl}/message/sendText/${evoInstanceName}`;
                const keysToTry = Array.from(new Set([evolutionGlobalKey, 'verto123', inst.token])).filter(Boolean);
                for (const key of keysToTry) {
                    try {
                        await axios_1.default.post(url, payload, {
                            headers: {
                                apikey: key,
                                'Content-Type': 'application/json',
                            },
                            timeout: 10000,
                        });
                        this.logger.log(`[2FA_DISPATCH_SUCCESS] Código enviado com sucesso para ${targetPhone12} via instância ${evoInstanceName}`);
                        return true;
                    }
                    catch (sendErr) {
                        this.logger.warn(`[2FA_DISPATCH_ATTEMPT_FAILED] Tentativa via ${evoInstanceName} falhou: ${sendErr.message}`);
                    }
                }
            }
            this.logger.error(`[2FA_DISPATCH_ERROR] Todas as tentativas de envio falharam para ${phone}. Código: ${otpCode}`);
            return false;
        }
        catch (err) {
            this.logger.error(`[2FA_DISPATCH_ERROR] Falha geral ao enviar WhatsApp para ${phone}: ${err.message}. Código: ${otpCode}`);
            return false;
        }
    }
};
exports.TwoFactorService = TwoFactorService;
exports.TwoFactorService = TwoFactorService = TwoFactorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TwoFactorService);
//# sourceMappingURL=two-factor.service.js.map