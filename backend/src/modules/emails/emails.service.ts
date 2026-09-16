import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../shared/database/prisma.service';
import { SendEmailDto } from './dto/send-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { EmailSettingsDto } from './dto/email-settings.dto';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém a instância do transporter do Nodemailer configurada para o Tenant específico.
   * Suporta configuração individual por cliente (salva no banco) com fallback para variáveis de ambiente.
   */
  private async getTransporter(tenantId?: string): Promise<{
    transporter: nodemailer.Transporter | null;
    fromAddress: string;
    source: 'tenant' | 'env' | 'none';
  }> {
    // 1. Tentar carregar configurações individuais do Tenant no banco de dados
    if (tenantId) {
      try {
        const effectiveId = await this.getEffectiveTenantId(tenantId);
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: effectiveId },
          select: { id: true, name: true, email: true, emailSettings: true },
        });

        const settings = tenant?.emailSettings as any;
        if (settings && settings.isActive !== false) {
          // A. Provedor Resend por Tenant
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

          // B. Provedor Gmail / Hostinger / SMTP Genérico por Tenant
          if (settings.smtpUser && settings.smtpPass) {
            const host = settings.smtpHost || (settings.provider === 'gmail' ? 'smtp.gmail.com' : (settings.provider === 'hostinger' ? 'smtp.hostinger.com' : 'smtp.gmail.com'));
            const port = Number(settings.smtpPort) || (settings.provider === 'hostinger' ? 465 : 587);
            const secure = settings.smtpSecure !== undefined ? Boolean(settings.smtpSecure) : (port === 465);

            const transporter = nodemailer.createTransport({
              host,
              port,
              secure,
              auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
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
      } catch (err: any) {
        this.logger.warn(`Erro ao carregar configurações de e-mail do tenant ${tenantId}: ${err.message}`);
      }
    }

    // 2. Fallback: Provedor Resend global via .env
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

    // 3. Fallback: Provedor SMTP Global via .env
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

  /**
   * Obtém as configurações de e-mail atuais do Tenant
   */
  async getEmailSettings(tenantId: string) {
    const effectiveId = await this.getEffectiveTenantId(tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: effectiveId },
      select: { id: true, name: true, email: true, emailSettings: true },
    });

    const s = (tenant?.emailSettings || {}) as any;
    const hasTenantCreds = Boolean((s.smtpUser && s.smtpPass) || s.resendApiKey);

    // Testar se está conectado atualmente
    let connected = false;
    let connectionError: string | null = null;

    if (hasTenantCreds) {
      try {
        const { transporter } = await this.getTransporter(effectiveId);
        if (transporter) {
          await Promise.race([
            transporter.verify(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao conectar no servidor de e-mail (5s)')), 5000)
            ),
          ]);
          connected = true;
        }
      } catch (err: any) {
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

  /**
   * Salva as configurações de e-mail exclusivas do Tenant
   */
  async saveEmailSettings(tenantId: string, dto: EmailSettingsDto) {
    const effectiveId = await this.getEffectiveTenantId(tenantId);
    
    // Obter dados atuais para preservar senha se não enviada
    const currentTenant = await this.prisma.tenant.findUnique({
      where: { id: effectiveId },
      select: { emailSettings: true },
    });
    const currentSettings = (currentTenant?.emailSettings || {}) as any;

    const newSettings: any = {
      provider: dto.provider,
      smtpHost: dto.smtpHost || (dto.provider === 'gmail' ? 'smtp.gmail.com' : (dto.provider === 'hostinger' ? 'smtp.hostinger.com' : 'smtp.gmail.com')),
      smtpPort: Number(dto.smtpPort) || (dto.provider === 'hostinger' ? 465 : 587),
      smtpSecure: dto.smtpSecure !== undefined ? Boolean(dto.smtpSecure) : (dto.smtpPort === 465 || dto.provider === 'hostinger'),
      smtpUser: dto.smtpUser || '',
      smtpPass: dto.smtpPass ? dto.smtpPass : currentSettings.smtpPass,
      fromName: dto.fromName || '',
      fromEmail: dto.fromEmail || dto.smtpUser || '',
      resendApiKey: dto.resendApiKey ? dto.resendApiKey : currentSettings.resendApiKey,
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.tenant.update({
      where: { id: effectiveId },
      data: {
        emailSettings: newSettings,
      },
    });

    // Testar a nova conexão
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

  /**
   * Testa a conexão SMTP em tempo real
   */
  async testConnection(tenantId: string, dto: EmailSettingsDto) {
    const effectiveId = await this.getEffectiveTenantId(tenantId);
    let passToUse = dto.smtpPass;

    // Se senha não fornecida, pegar a senha salva existente
    if (!passToUse) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: effectiveId },
        select: { emailSettings: true },
      });
      const s = (tenant?.emailSettings || {}) as any;
      passToUse = s.smtpPass;
    }

    try {
      let testTransporter: nodemailer.Transporter;

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
      } else {
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
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout de 7 segundos ao tentar conectar ao servidor de e-mail.')), 7000)
        ),
      ]);

      return {
        success: true,
        message: 'Conexão e autenticação com o servidor de e-mail foram bem-sucedidas!',
      };
    } catch (err: any) {
      let friendlyMessage = err.message || 'Erro ao conectar ao servidor SMTP';
      if (err.responseCode === 535 || friendlyMessage.includes('BadCredentials') || friendlyMessage.includes('Invalid login') || friendlyMessage.includes('Username and Password not accepted')) {
        friendlyMessage = 'Credenciais rejeitadas pelo provedor. Verifique se o e-mail e a Senha de App (16 dígitos) estão corretos e se a autenticação em 2 etapas está ativa.';
      } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
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

  /**
   * Diagnóstico do status de configuração do transporte de e-mails para o Tenant
   */
  async getTransportStatus(tenantId?: string) {
    const effectiveId = tenantId ? await this.getEffectiveTenantId(tenantId) : null;
    const { transporter, fromAddress, source } = await this.getTransporter(effectiveId || undefined);

    let isConnected = false;
    let connectionError: string | null = null;

    if (transporter) {
      try {
        await Promise.race([
          transporter.verify(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout ao conectar no servidor SMTP (5s)')), 5000)
          ),
        ]);
        isConnected = true;
      } catch (err: any) {
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

  /**
   * Garante que o tenantId informado no token seja válido e existente no banco.
   * Evita violações de chave estrangeira (P2003) caso o token possua um tenant legado ou customizado.
   */
  private async getEffectiveTenantId(tenantId: string): Promise<string> {
    if (!tenantId) return 'tenant_123';
    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant) return tenant.id;

      // Se o tenant informado no token não existir, buscar o primeiro tenant ativo
      const firstActive = await this.prisma.tenant.findFirst({ where: { isActive: true } });
      if (firstActive) return firstActive.id;

      const anyTenant = await this.prisma.tenant.findFirst();
      if (anyTenant) return anyTenant.id;

      return tenantId;
    } catch (e: any) {
      this.logger.warn(`Erro ao resolver tenant efetivo: ${e?.message}`);
      return 'tenant_123';
    }
  }

  async listEmails(
    tenantId: string,
    query: {
      folder?: string;
      search?: string;
      isStarred?: boolean | string;
      isRead?: boolean | string;
      page?: number | string;
      limit?: number | string;
    },
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const effectiveTenantId = await this.getEffectiveTenantId(tenantId);

    // Verificar se o tenant já possui e-mails no banco. Se não tiver, criar semente inicial realista.
    const countTotal = await this.prisma.emailMessage.count({ where: { tenantId: effectiveTenantId } });
    if (countTotal === 0) {
      try {
        await this.seedInitialEmails(effectiveTenantId);
      } catch (err: any) {
        this.logger.warn(`Seed inicial de e-mails cancelado com segurança: ${err?.message}`);
      }
    }

    const where: any = { tenantId: effectiveTenantId };

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

  async getCounts(tenantId: string) {
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

  async getEmailById(tenantId: string, id: string) {
    const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId: effectiveTenantId },
      include: {
        contact: true,
        deal: true,
      },
    });

    if (!email) {
      throw new NotFoundException('E-mail não encontrado.');
    }

    // Marca como lido se ainda não estava
    if (!email.isRead) {
      await this.prisma.emailMessage.update({
        where: { id },
        data: { isRead: true },
      });
      email.isRead = true;
    }

    return email;
  }

  async sendEmail(tenantId: string, dto: SendEmailDto) {
    const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
    const preview = dto.bodyText.slice(0, 140);
    const bodyHtml = dto.bodyHtml || `<p>${dto.bodyText.replace(/\n/g, '<br/>')}</p>`;
    const hasAttachments = Boolean(dto.attachments && Array.isArray(dto.attachments) && dto.attachments.length > 0);

    // 1. Gravação prévia no banco de dados Supabase na pasta SENT
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

    // 2. Disparo externo real via Nodemailer com transporte dinâmico do cliente
    const { transporter, fromAddress, source } = await this.getTransporter(effectiveTenantId);

    if (!transporter) {
      console.error('[EMAIL_SMTP_CONFIG_ERROR] Falha ao disparar e-mail externo: Nenhuma credencial de e-mail conectada para o cliente.', {
        destinatario: dto.recipientEmail,
        assunto: dto.subject,
        tenantId: effectiveTenantId,
        source,
      });

      throw new BadRequestException(
        `E-mail registrado no banco VERSUS, mas NÃO foi disparado externamente: Nenhuma conta de e-mail conectada para este cliente. Acesse a aba "Configurações de E-mail" para conectar seu Gmail ou servidor SMTP.`
      );
    }

    try {
      const finalFromAddress = fromAddress || (dto.senderEmail ? `"${dto.senderName || 'VERSUS'}" <${dto.senderEmail}>` : 'VERSUS <comercial@versus.com.br>');

      const mailOptions: nodemailer.SendMailOptions = {
        from: finalFromAddress,
        to: dto.recipientName ? `"${dto.recipientName}" <${dto.recipientEmail}>` : dto.recipientEmail,
        subject: dto.subject,
        text: dto.bodyText,
        html: bodyHtml,
      };

      if (dto.cc) mailOptions.cc = dto.cc;
      if (dto.bcc) mailOptions.bcc = dto.bcc;

      if (hasAttachments && Array.isArray(dto.attachments)) {
        mailOptions.attachments = dto.attachments.map((att: any) => ({
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
    } catch (error: any) {
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

      throw new BadRequestException(
        `Falha na entrega do e-mail externo pelo servidor SMTP: ${error?.message || 'Erro de conexão/autenticação'}. O e-mail foi registrado no banco, mas não chegou à caixa de entrada do destinatário.`
      );
    }
  }

  async updateEmail(tenantId: string, id: string, dto: UpdateEmailDto) {
    const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId: effectiveTenantId },
    });

    if (!email) {
      throw new NotFoundException('E-mail não encontrado.');
    }

    const data: any = {};
    if (dto.folder !== undefined) data.folder = dto.folder.toUpperCase();
    if (dto.isRead !== undefined) data.isRead = dto.isRead;
    if (dto.isStarred !== undefined) data.isStarred = dto.isStarred;

    return this.prisma.emailMessage.update({
      where: { id },
      data,
    });
  }

  async toggleStar(tenantId: string, id: string) {
    const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId: effectiveTenantId },
    });

    if (!email) {
      throw new NotFoundException('E-mail não encontrado.');
    }

    return this.prisma.emailMessage.update({
      where: { id },
      data: { isStarred: !email.isStarred },
    });
  }

  async moveToFolder(tenantId: string, id: string, folder: string) {
    const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId: effectiveTenantId },
    });

    if (!email) {
      throw new NotFoundException('E-mail não encontrado.');
    }

    return this.prisma.emailMessage.update({
      where: { id },
      data: { folder: folder.toUpperCase() },
    });
  }

  async deleteEmail(tenantId: string, id: string) {
    const effectiveTenantId = await this.getEffectiveTenantId(tenantId);
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId: effectiveTenantId },
    });

    if (!email) {
      throw new NotFoundException('E-mail não encontrado.');
    }

    if (email.folder === 'TRASH') {
      return this.prisma.emailMessage.delete({ where: { id } });
    }

    return this.prisma.emailMessage.update({
      where: { id },
      data: { folder: 'TRASH' },
    });
  }

  private async seedInitialEmails(tenantId: string) {
    try {
      const tenantExists = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenantExists) return;

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
        } catch (itemErr: any) {
          this.logger.warn(`Item de seed ignorado: ${itemErr?.message}`);
        }
      }
    } catch (e: any) {
      this.logger.warn(`Seed de e-mails cancelado com segurança: ${e?.message}`);
    }
  }
}
