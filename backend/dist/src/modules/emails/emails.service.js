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
var EmailsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailsService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
const prisma_service_1 = require("../../shared/database/prisma.service");
let EmailsService = EmailsService_1 = class EmailsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailsService_1.name);
    }
    async getTransporter(tenantId) {
        if (tenantId) {
            try {
                const effectiveId = await this.getEffectiveTenantId(tenantId);
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: effectiveId },
                    select: { id: true, name: true, email: true, emailSettings: true },
                });
                const settings = tenant?.emailSettings;
                if (settings && settings.isActive !== false) {
                    if (settings.provider === 'resend' && settings.resendApiKey) {
                        const transporter = nodemailer.createTransport({
                            host: 'smtp.resend.com',
                            port: 465,
                            secure: true,
                            auth: {
                                user: 'resend',
                                pass: settings.resendApiKey,
                            },
                        });
                        const from = settings.fromEmail
                            ? (settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail)
                            : 'VERSUS <onboarding@resend.dev>';
                        return { transporter, fromAddress: from, source: 'tenant' };
                    }
                    if (settings.smtpUser && settings.smtpPass) {
                        const host = settings.smtpHost || (settings.provider === 'gmail' ? 'smtp.gmail.com' : (settings.provider === 'hostinger' ? 'smtp.hostinger.com' : 'smtp.gmail.com'));
                        const port = Number(settings.smtpPort) || (settings.provider === 'hostinger' ? 465 : 587);
                        const secure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : (port === 465);
                        const cleanPass = settings.provider === 'gmail' ? settings.smtpPass.replace(/\s+/g, '') : settings.smtpPass;
                        const transporter = nodemailer.createTransport({
                            host,
                            port,
                            secure,
                            auth: {
                                user: settings.smtpUser.trim(),
                                pass: cleanPass,
                            },
                            tls: {
                                rejectUnauthorized: false,
                            },
                        });
                        const fromName = settings.fromName || tenant.name || 'VERSUS';
                        const fromEmail = settings.fromEmail || settings.smtpUser;
                        return {
                            transporter,
                            fromAddress: `"${fromName}" <${fromEmail}>`,
                            source: 'tenant',
                        };
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Erro ao carregar configurações de e-mail do tenant ${tenantId}: ${err.message}`);
            }
        }
        if (process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
                host: 'smtp.resend.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'resend',
                    pass: process.env.RESEND_API_KEY,
                },
            });
            const from = process.env.SMTP_FROM || process.env.MAIL_FROM || 'VERSUS <onboarding@resend.dev>';
            return { transporter, fromAddress: from, source: 'env' };
        }
        const host = process.env.SMTP_HOST;
        const port = Number(process.env.SMTP_PORT) || 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const secure = process.env.SMTP_SECURE === 'true' || port === 465;
        if (host && user && pass) {
            const transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: { user, pass },
                tls: { rejectUnauthorized: process.env.SMTP_IGNORE_TLS !== 'true' },
            });
            const from = process.env.SMTP_FROM || process.env.MAIL_FROM || (user ? `VERSUS <${user}>` : 'VERSUS <comercial@versus.com.br>');
            return { transporter, fromAddress: from, source: 'env' };
        }
        return { transporter: null, fromAddress: '', source: 'none' };
    }
    async getEmailSettings(tenantId) {
        const effectiveId = await this.getEffectiveTenantId(tenantId);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: effectiveId },
            select: { id: true, name: true, email: true, emailSettings: true },
        });
        const s = (tenant?.emailSettings || {});
        const hasTenantCreds = Boolean((s.smtpUser && s.smtpPass) || s.resendApiKey);
        let connected = false;
        let connectionError = null;
        if (hasTenantCreds) {
            try {
                const { transporter } = await this.getTransporter(effectiveId);
                if (transporter) {
                    await Promise.race([
                        transporter.verify(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao conectar no servidor de e-mail (5s)')), 5000)),
                    ]);
                    connected = true;
                }
            }
            catch (err) {
                connectionError = err.message || 'Falha ao conectar no servidor SMTP';
            }
        }
        return {
            provider: s.provider || 'gmail',
            smtpHost: s.smtpHost || 'smtp.gmail.com',
            smtpPort: s.smtpPort || 587,
            smtpSecure: s.smtpSecure ?? false,
            smtpUser: s.smtpUser || '',
            hasPassword: Boolean(s.smtpPass),
            fromName: s.fromName || tenant?.name || '',
            fromEmail: s.fromEmail || s.smtpUser || '',
            resendApiKey: s.resendApiKey ? `${s.resendApiKey.slice(0, 6)}...` : '',
            isActive: s.isActive ?? true,
            configured: hasTenantCreds,
            connected,
            connectionError,
            source: hasTenantCreds ? 'tenant' : (process.env.SMTP_HOST || process.env.RESEND_API_KEY ? 'env' : 'none'),
        };
    }
    async saveEmailSettings(tenantId, dto) {
        const effectiveId = await this.getEffectiveTenantId(tenantId);
        const currentTenant = await this.prisma.tenant.findUnique({
            where: { id: effectiveId },
            select: { emailSettings: true },
        });
        const currentSettings = (currentTenant?.emailSettings || {});
        let rawPass = dto.smtpPass ? dto.smtpPass : currentSettings.smtpPass;
        if (dto.provider === 'gmail' && rawPass) {
            rawPass = rawPass.replace(/\s+/g, '');
        }
        const newSettings = {
            provider: dto.provider,
            smtpHost: dto.smtpHost || (dto.provider === 'gmail' ? 'smtp.gmail.com' : (dto.provider === 'hostinger' ? 'smtp.hostinger.com' : 'smtp.gmail.com')),
            smtpPort: Number(dto.smtpPort) || (dto.provider === 'hostinger' ? 465 : 587),
            smtpSecure: dto.smtpSecure !== undefined ? Boolean(dto.smtpSecure) : (dto.smtpPort === 465 || dto.provider === 'hostinger'),
            smtpUser: (dto.smtpUser || '').trim(),
            smtpPass: rawPass,
            fromName: (dto.fromName || '').trim(),
            fromEmail: (dto.fromEmail || dto.smtpUser || '').trim(),
            resendApiKey: (dto.resendApiKey ? dto.resendApiKey : currentSettings.resendApiKey || '').trim(),
            isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
            updatedAt: new Date().toISOString(),
        };
        await this.prisma.tenant.update({
            where: { id: effectiveId },
            data: {
                emailSettings: newSettings,
            },
        });
        const testRes = await this.testConnection(effectiveId, newSettings);
        return {
            success: true,
            message: 'Configurações de e-mail salvas com sucesso para o cliente!',
            connected: testRes.success,
            connectionError: testRes.error || null,
            settings: {
                ...newSettings,
                smtpPass: undefined,
                hasPassword: Boolean(newSettings.smtpPass),
            },
        };
    }
    async testConnection(tenantId, dto) {
        const effectiveId = await this.getEffectiveTenantId(tenantId);
        let passToUse = dto.smtpPass;
        if (!passToUse) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: effectiveId },
                select: { emailSettings: true },
            });
            const s = (tenant?.emailSettings || {});
            passToUse = s.smtpPass;
        }
        if (dto.provider === 'gmail' && passToUse) {
            passToUse = passToUse.replace(/\s+/g, '');
        }
        try {
            let testTransporter;
            if (dto.provider === 'resend') {
                const key = dto.resendApiKey;
                if (!key) {
                    return { success: false, error: 'Chave de API do Resend não informada.' };
                }
                testTransporter = nodemailer.createTransport({
                    host: 'smtp.resend.com',
                    port: 465,
                    secure: true,
                    auth: { user: 'resend', pass: key },
                });
            }
            else {
                const host = dto.smtpHost || (dto.provider === 'gmail' ? 'smtp.gmail.com' : (dto.provider === 'hostinger' ? 'smtp.hostinger.com' : 'smtp.gmail.com'));
                const port = Number(dto.smtpPort) || (dto.provider === 'hostinger' ? 465 : 587);
                const secure = dto.smtpSecure !== undefined ? Boolean(dto.smtpSecure) : (port === 465);
                if (!dto.smtpUser || !passToUse) {
                    return { success: false, error: 'E-mail do usuário e senha são obrigatórios para o teste de conexão.' };
                }
                testTransporter = nodemailer.createTransport({
                    host,
                    port,
                    secure,
                    auth: {
                        user: dto.smtpUser,
                        pass: passToUse,
                    },
                    tls: {
                        rejectUnauthorized: false,
                    },
                });
            }
            await Promise.race([
                testTransporter.verify(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 7 segundos ao tentar conectar ao servidor de e-mail.')), 7000)),
            ]);
            return {
                success: true,
                message: 'Conexão e autenticação com o servidor de e-mail foram bem-sucedidas!',
            };
        }
        catch (err) {
            let friendlyMessage = err.message || 'Erro ao conectar ao servidor SMTP';
            if (err.responseCode === 535 || friendlyMessage.includes('BadCredentials') || friendlyMessage.includes('Invalid login') || friendlyMessage.includes('Username and Password not accepted')) {
                friendlyMessage = 'Credenciais rejeitadas pelo provedor. Verifique se o e-mail e a Senha de App (16 dígitos) estão corretos e se a autenticação em 2 etapas está ativa.';
            }
            else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
                friendlyMessage = `Não foi possível conectar ao host SMTP na porta informada (${err.code}).`;
            }
            return {
                success: false,
                error: friendlyMessage,
                details: err.message,
                code: err.code,
            };
        }
    }
    async syncEmails(tenantId) {
        const effectiveId = await this.getEffectiveTenantId(tenantId);
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: effectiveId },
            select: { id: true, name: true, email: true, emailSettings: true },
        });
        const s = (tenant?.emailSettings || {});
        const user = (s.smtpUser || process.env.SMTP_USER || '').trim();
        const pass = (s.smtpPass || process.env.SMTP_PASS || '').replace(/\s+/g, '');
        const provider = s.provider || 'gmail';
        if (!user || !pass) {
            throw new common_1.BadRequestException('Configurações de e-mail ausentes para sincronização IMAP. Configure sua conta na aba de configurações.');
        }
        let host = 'imap.gmail.com';
        let port = 993;
        let secure = true;
        if (provider === 'hostinger') {
            host = 'imap.hostinger.com';
            port = 993;
        }
        else if (provider === 'smtp') {
            host = s.imapHost || (s.smtpHost ? s.smtpHost.replace('smtp.', 'imap.') : 'imap.gmail.com');
            port = s.imapPort ? Number(s.imapPort) : 993;
        }
        const { ImapFlow } = await Promise.resolve().then(() => require('imapflow'));
        const { simpleParser } = await Promise.resolve().then(() => require('mailparser'));
        const client = new ImapFlow({
            host,
            port,
            secure,
            auth: { user, pass },
            logger: false,
        });
        let newEmailsCount = 0;
        let totalMessages = 0;
        try {
            await client.connect();
            const lock = await client.getMailboxLock('INBOX');
            try {
                const mb = client.mailbox;
                totalMessages = (mb && typeof mb === 'object' ? mb.exists : 0) || 0;
                if (totalMessages > 0) {
                    const fetchLimit = Math.min(totalMessages, 30);
                    const range = totalMessages > fetchLimit ? `${totalMessages - fetchLimit + 1}:*` : '1:*';
                    for await (let message of client.fetch(range, { envelope: true, source: true, flags: true, uid: true })) {
                        const parsed = await simpleParser(message.source);
                        const messageId = parsed.messageId || `imap-${message.uid}-${effectiveId}`;
                        const subject = parsed.subject || '(Sem assunto)';
                        const senderName = parsed.from?.value?.[0]?.name || parsed.from?.text || 'Remetente Desconhecido';
                        const senderEmail = parsed.from?.value?.[0]?.address || 'desconhecido@email.com';
                        const date = parsed.date || new Date();
                        const bodyText = parsed.text || '';
                        const bodyHtml = parsed.html || parsed.textAsHtml || null;
                        const preview = bodyText.slice(0, 160).replace(/\s+/g, ' ').trim();
                        const isRead = message.flags ? message.flags.has('\\Seen') : false;
                        const isStarred = message.flags ? message.flags.has('\\Flagged') : false;
                        const exists = await this.prisma.emailMessage.findFirst({
                            where: {
                                tenantId: effectiveId,
                                threadId: messageId,
                            },
                        });
                        if (!exists) {
                            await this.prisma.emailMessage.create({
                                data: {
                                    tenantId: effectiveId,
                                    threadId: messageId,
                                    senderName,
                                    senderEmail,
                                    recipientEmail: user,
                                    recipientName: s.fromName || tenant.name || 'VERSUS',
                                    subject,
                                    bodyText,
                                    bodyHtml,
                                    preview,
                                    folder: 'INBOX',
                                    isRead,
                                    isStarred,
                                    hasAttachments: Boolean(parsed.attachments && parsed.attachments.length > 0),
                                    sentAt: date,
                                    receivedAt: new Date(),
                                },
                            });
                            newEmailsCount++;
                        }
                    }
                }
            }
            finally {
                lock.release();
            }
            await client.logout();
            return {
                success: true,
                message: `Sincronização concluída com sucesso! ${newEmailsCount} novo(s) e-mail(s) importado(s).`,
                totalInBox: totalMessages,
                newEmailsCount,
            };
        }
        catch (err) {
            this.logger.error(`[IMAP_SYNC_ERROR] Falha ao sincronizar e-mails: ${err.message}`);
            throw new common_1.BadRequestException(`Erro ao conectar no servidor IMAP: ${err.message}`);
        }
    }
    async getTransportStatus(tenantId) {
        const effectiveId = tenantId ? await this.getEffectiveTenantId(tenantId) : null;
        const { transporter, fromAddress, source } = await this.getTransporter(effectiveId || undefined);
        let isConnected = false;
        let connectionError = null;
        if (transporter) {
            try {
                await Promise.race([
                    transporter.verify(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao conectar no servidor SMTP (5s)')), 5000)),
                ]);
                isConnected = true;
            }
            catch (err) {
                connectionError = err.message || 'Erro ao verificar conexão SMTP';
            }
        }
        return {
            configured: Boolean(transporter),
            connected: isConnected,
            from: fromAddress || null,
            source,
            connectionError,
        };
    }
    async getEffectiveTenantId(tenantId) {
        if (!tenantId)
            return 'tenant_123';
        try {
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (tenant)
                return tenant.id;
            const firstActive = await this.prisma.tenant.findFirst({ where: { isActive: true } });
            if (firstActive)
                return firstActive.id;
            const anyTenant = await this.prisma.tenant.findFirst();
            if (anyTenant)
                return anyTenant.id;
            return tenantId;
        }
        catch (e) {
            this.logger.warn(`Erro ao resolver tenant efetivo: ${e?.message}`);
            return 'tenant_123';
        }
    }
    async listEmails(tenantId, query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
        const skip = (page - 1) * limit;
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const countTotal = await this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId } });
        if (countTotal === 0) {
            try {
                await this.seedInitialEmails(effectiveTenantId);
            }
            catch (err) {
                this.logger.warn(`Seed inicial de e-mails cancelado com segurança: ${err?.message}`);
            }
        }
        const where = { tenantId: effectiveTenantId };
        if (query.folder) {
            where.folder = String(query.folder).toUpperCase();
        }
        if (query.isStarred !== undefined && query.isStarred !== '') {
            where.isStarred = query.isStarred === true || query.isStarred === 'true';
        }
        if (query.isRead !== undefined && query.isRead !== '') {
            where.isRead = query.isRead === true || query.isRead === 'true';
        }
        if (query.search && query.search.trim() !== '') {
            const s = query.search.trim();
            where.OR = [
                { subject: { contains: s, mode: 'insensitive' } },
                { senderName: { contains: s, mode: 'insensitive' } },
                { senderEmail: { contains: s, mode: 'insensitive' } },
                { recipientEmail: { contains: s, mode: 'insensitive' } },
                { bodyText: { contains: s, mode: 'insensitive' } },
            ];
        }
        const [emails, total] = await Promise.all([
            this.prisma.emailMessage.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    contact: {
                        select: { id: true, name: true, phone: true, email: true },
                    },
                    deal: {
                        select: { id: true, title: true, value: true, status: true },
                    },
                },
            }),
            this.prisma.emailMessage.count({ where }),
        ]);
        return {
            emails,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getCounts(tenantId) {
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const [inbox, unread, starred, sent, draft, trash, archive] = await Promise.all([
            this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId, folder: 'INBOX' } }),
            this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId, folder: 'INBOX', isRead: false } }),
            this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId, isStarred: true } }),
            this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId, folder: 'SENT' } }),
            this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId, folder: 'DRAFT' } }),
            this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId, folder: 'TRASH' } }),
            this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId, folder: 'ARCHIVE' } }),
        ]);
        return {
            inbox,
            unread,
            starred,
            sent,
            draft,
            trash,
            archive,
        };
    }
    async getEmailById(tenantId, id) {
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const email = await this.prisma.emailMessage.findFirst({
            where: { id, tenantId: effectiveTenantId },
            include: {
                contact: true,
                deal: true,
            },
        });
        if (!email) {
            throw new common_1.NotFoundException('E-mail não encontrado.');
        }
        if (!email.isRead) {
            await this.prisma.emailMessage.update({
                where: { id },
                data: { isRead: true },
            });
            email.isRead = true;
        }
        return email;
    }
    async sendEmail(tenantId, dto) {
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const preview = dto.bodyText.slice(0, 140);
        const bodyHtml = dto.bodyHtml || `<p>${dto.bodyText.replace(/\n/g, '<br/>')}</p>`;
        const hasAttachments = Boolean(dto.attachments && Array.isArray(dto.attachments) && dto.attachments.length > 0);
        const email = await this.prisma.emailMessage.create({
            data: {
                tenantId: effectiveTenantId,
                recipientEmail: dto.recipientEmail,
                recipientName: dto.recipientName || dto.recipientEmail.split('@')[0],
                senderName: dto.senderName || 'Atendimento Comercial VERSUS',
                senderEmail: dto.senderEmail || process.env.SMTP_USER || 'comercial@versus.com.br',
                cc: dto.cc || null,
                bcc: dto.bcc || null,
                subject: dto.subject,
                bodyText: dto.bodyText,
                bodyHtml,
                preview,
                folder: (dto.folder || 'SENT').toUpperCase(),
                isRead: true,
                isStarred: false,
                hasAttachments,
                attachments: dto.attachments || null,
                contactId: dto.contactId || null,
                dealId: dto.dealId || null,
                proposalId: dto.proposalId || null,
                contractId: dto.contractId || null,
                threadId: dto.threadId || null,
                sentAt: new Date(),
            },
            include: {
                contact: true,
                deal: true,
            },
        });
        const { transporter, fromAddress, source } = await this.getTransporter(effectiveTenantId);
        if (!transporter) {
            console.error('[EMAIL_SMTP_CONFIG_ERROR] Falha ao disparar e-mail externo: Nenhuma credencial de e-mail conectada para o cliente.', {
                destinatario: dto.recipientEmail,
                assunto: dto.subject,
                tenantId: effectiveTenantId,
                source,
            });
            throw new common_1.BadRequestException(`E-mail registrado no banco VERSUS, mas NÃO foi disparado externamente: Nenhuma conta de e-mail conectada para este cliente. Acesse a aba "Configurações de E-mail" para conectar seu Gmail ou servidor SMTP.`);
        }
        try {
            const finalFromAddress = fromAddress || (dto.senderEmail ? `"${dto.senderName || 'VERSUS'}" <${dto.senderEmail}>` : 'VERSUS <comercial@versus.com.br>');
            const mailOptions = {
                from: finalFromAddress,
                to: dto.recipientName ? `"${dto.recipientName}" <${dto.recipientEmail}>` : dto.recipientEmail,
                subject: dto.subject,
                text: dto.bodyText,
                html: bodyHtml,
            };
            if (dto.cc)
                mailOptions.cc = dto.cc;
            if (dto.bcc)
                mailOptions.bcc = dto.bcc;
            if (hasAttachments && Array.isArray(dto.attachments)) {
                mailOptions.attachments = dto.attachments.map((att) => ({
                    filename: att.name || 'anexo.pdf',
                    path: att.url,
                    contentType: att.type,
                }));
            }
            console.log(`[EMAIL_DISPATCH_INIT] Iniciando disparo externo via Nodemailer para: ${dto.recipientEmail}...`, {
                from: fromAddress,
                to: dto.recipientEmail,
                subject: dto.subject,
                hasAttachments,
            });
            const info = await transporter.sendMail(mailOptions);
            console.log('[EMAIL_DISPATCH_SUCCESS] E-mail entregue com sucesso pelo servidor de transporte SMTP:', {
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                response: info.response,
                destinatario: dto.recipientEmail,
            });
            return email;
        }
        catch (error) {
            console.error('[EMAIL_DISPATCH_EXTERNAL_ERROR] Exceção crítica ao disparar e-mail externo via SMTP:', {
                destinatario: dto.recipientEmail,
                assunto: dto.subject,
                message: error?.message,
                code: error?.code,
                command: error?.command,
                response: error?.response,
                responseCode: error?.responseCode,
                stack: error?.stack,
            });
            throw new common_1.BadRequestException(`Falha na entrega do e-mail externo pelo servidor SMTP: ${error?.message || 'Erro de conexão/autenticação'}. O e-mail foi registrado no banco, mas não chegou à caixa de entrada do destinatário.`);
        }
    }
    async updateEmail(tenantId, id, dto) {
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const email = await this.prisma.emailMessage.findFirst({
            where: { id, tenantId: effectiveTenantId },
        });
        if (!email) {
            throw new common_1.NotFoundException('E-mail não encontrado.');
        }
        const data = {};
        if (dto.folder !== undefined)
            data.folder = dto.folder.toUpperCase();
        if (dto.isRead !== undefined)
            data.isRead = dto.isRead;
        if (dto.isStarred !== undefined)
            data.isStarred = dto.isStarred;
        return this.prisma.emailMessage.update({
            where: { id },
            data,
        });
    }
    async toggleStar(tenantId, id) {
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const email = await this.prisma.emailMessage.findFirst({
            where: { id, tenantId: effectiveTenantId },
        });
        if (!email) {
            throw new common_1.NotFoundException('E-mail não encontrado.');
        }
        return this.prisma.emailMessage.update({
            where: { id },
            data: { isStarred: !email.isStarred },
        });
    }
    async moveToFolder(tenantId, id, folder) {
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const email = await this.prisma.emailMessage.findFirst({
            where: { id, tenantId: effectiveTenantId },
        });
        if (!email) {
            throw new common_1.NotFoundException('E-mail não encontrado.');
        }
        return this.prisma.emailMessage.update({
            where: { id },
            data: { folder: folder.toUpperCase() },
        });
    }
    async deleteEmail(tenantId, id) {
        const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
        const email = await this.prisma.emailMessage.findFirst({
            where: { id, tenantId: effectiveTenantId },
        });
        if (!email) {
            throw new common_1.NotFoundException('E-mail não encontrado.');
        }
        if (email.folder === 'TRASH') {
            return this.prisma.emailMessage.delete({ where: { id } });
        }
        return this.prisma.emailMessage.update({
            where: { id },
            data: { folder: 'TRASH' },
        });
    }
    async seedInitialEmails(tenantId) {
        try {
            const tenantExists = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenantExists)
                return;
            const initialEmails = [
                {
                    tenantId,
                    senderName: 'Roberto Alencar',
                    senderEmail: 'roberto@nexuslog.com.br',
                    recipientEmail: 'comercial@versus.com.br',
                    recipientName: 'Equipe Comercial VERSUS',
                    subject: 'Re: Proposta Comercial PROP-2026-1042 - Aceite & Assinatura Digital',
                    bodyText: `Olá equipe VERSUS,\n\nAnalisamos a minuta do contrato e a proposta comercial enviada. Estamos 100% de acordo com as condições de implantação do módulo omnichannel e inteligência artificial.\n\nJá encaminhei o link de assinatura para nossa diretoria jurídica aprovar e daremos sequência ao faturamento.\n\nAtenciosamente,\nRoberto Alencar\nDiretor de Operações | Nexus Logística`,
                    preview: 'Analisamos a minuta do contrato e a proposta comercial enviada. Estamos 100% de acordo...',
                    folder: 'INBOX',
                    isRead: false,
                    isStarred: true,
                    hasAttachments: true,
                    attachments: [
                        { name: 'Anexo_Aceite_Nexus.pdf', url: 'https://verus-alpha.vercel.app/docs/aceite.pdf', size: 245000, type: 'application/pdf' },
                    ],
                    createdAt: new Date(Date.now() - 35 * 60000),
                },
                {
                    tenantId,
                    senderName: 'Fernanda Takahashi',
                    senderEmail: 'fernanda@inovareodonto.com.br',
                    recipientEmail: 'comercial@versus.com.br',
                    recipientName: 'Equipe VERSUS',
                    subject: 'Dúvida sobre integração da IA Vitor com prontuário eletrônico',
                    bodyText: `Bom dia equipe VERSUS,\n\nGostaríamos de tirar uma dúvida técnica: a IA consegue consultar os horários vagos dos dentistas via webhook e já sugerir a consulta diretamente na janela de conversa do WhatsApp?\n\nFicamos no aguardo para formalizar o fechamento do plano Enterprise.\n\nAbraços,\nFernanda Takahashi\nGestora de Atendimento | Inovare Odontologia`,
                    preview: 'Gostaríamos de tirar uma dúvida técnica: a IA consegue consultar os horários vagos dos dentistas...',
                    folder: 'INBOX',
                    isRead: true,
                    isStarred: false,
                    hasAttachments: false,
                    createdAt: new Date(Date.now() - 2 * 3600000),
                },
                {
                    tenantId,
                    senderName: 'Marcelo Dantas',
                    senderEmail: 'marcelo@dantasadv.com.br',
                    recipientEmail: 'financeiro@versus.com.br',
                    recipientName: 'Departamento Financeiro',
                    subject: 'Comprovante de pagamento da parcela de implantação',
                    bodyText: `Prezados,\n\nSegue em anexo o comprovante da TED referente à implantação da plataforma VERSUS em nosso escritório.\n\nSolicitamos a emissão da Nota Fiscal correspondente.\n\nCordialmente,\nMarcelo Dantas\nSócio Administrador | Dantas Advocacia`,
                    preview: 'Segue em anexo o comprovante da TED referente à implantação da plataforma VERSUS...',
                    folder: 'INBOX',
                    isRead: true,
                    isStarred: false,
                    hasAttachments: true,
                    attachments: [
                        { name: 'Comprovante_TED_Dantas.pdf', url: 'https://verus-alpha.vercel.app/docs/comprovante.pdf', size: 180000, type: 'application/pdf' },
                    ],
                    createdAt: new Date(Date.now() - 24 * 3600000),
                },
                {
                    tenantId,
                    senderName: 'Equipe de Sucesso VERSUS',
                    senderEmail: 'onboarding@versus.com.br',
                    recipientEmail: 'cliente@empresa.com.br',
                    recipientName: 'Gestor Comercial',
                    subject: 'Bem-vindo ao VERSUS - Guia Rápido de Configuração Omnichannel',
                    bodyText: `Parabéns por escolher a VERSUS Omnichannel AI Platform!\n\nSeu ambiente de produção está pronto para uso. Conecte sua instância oficial de WhatsApp em Configurações > Conexões WhatsApp para ativar o atendimento automatizado da IA.\n\nConte com nosso suporte 24/7.`,
                    preview: 'Parabéns por escolher a VERSUS Omnichannel AI Platform! Seu ambiente de produção está pronto...',
                    folder: 'SENT',
                    isRead: true,
                    isStarred: false,
                    hasAttachments: false,
                    createdAt: new Date(Date.now() - 48 * 3600000),
                },
            ];
            for (const em of initialEmails) {
                try {
                    await this.prisma.emailMessage.create({ data: em });
                }
                catch (itemErr) {
                    this.logger.warn(`Item de seed ignorado: ${itemErr?.message}`);
                }
            }
        }
        catch (e) {
            this.logger.warn(`Seed de e-mails cancelado com segurança: ${e?.message}`);
        }
    }
};
exports.EmailsService = EmailsService;
exports.EmailsService = EmailsService = EmailsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailsService);
//# sourceMappingURL=emails.service.js.map