import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../shared/database/prisma.service';
import { SendEmailDto } from './dto/send-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém a instância do transporter do Nodemailer configurado via variáveis de ambiente.
   * Suporta SMTP genérico (Gmail, Hostinger, SendGrid, Amazon SES) e Resend.
   */
  private getTransporter(): nodemailer.Transporter | null {
    // 1. Provedor Resend via SMTP
    if (process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      });
    }

    // 2. Provedor SMTP Padrão
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_IGNORE_TLS !== 'true',
      },
    });
  }

  /**
   * Diagnóstico do status de configuração do transporte de e-mails
   */
  async getTransportStatus() {
    const isResend = Boolean(process.env.RESEND_API_KEY && !process.env.SMTP_HOST);
    const host = isResend ? 'smtp.resend.com' : (process.env.SMTP_HOST || null);
    const port = Number(process.env.SMTP_PORT) || (isResend ? 465 : 587);
    const user = isResend ? 'resend' : (process.env.SMTP_USER || null);
    const hasPass = Boolean(process.env.SMTP_PASS || process.env.RESEND_API_KEY);
    const from = process.env.SMTP_FROM || process.env.MAIL_FROM || (user ? `VERSUS <${user}>` : null);

    const isConfigured = Boolean(host && user && hasPass);

    let isConnected = false;
    let connectionError: string | null = null;

    if (isConfigured) {
      try {
        const transporter = this.getTransporter();
        if (transporter) {
          await Promise.race([
            transporter.verify(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao conectar no servidor SMTP (5s)')), 5000)
            ),
          ]);
          isConnected = true;
        }
      } catch (err: any) {
        connectionError = err.message || 'Erro ao verificar conexão SMTP';
        console.error('[EMAIL_SMTP_VERIFY_ERROR] Falha ao testar conexão SMTP:', {
          host,
          port,
          user,
          error: err.message,
          code: err.code,
          response: err.response,
        });
      }
    }

    return {
      configured: isConfigured,
      connected: isConnected,
      provider: isResend ? 'Resend' : (host || 'Nenhum'),
      host,
      port,
      user: user ? `${user.slice(0, 3)}***@${user.split('@')[1] || 'dominio'}` : null,
      from,
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

    // 2. Disparo externo real via Nodemailer / Provedor SMTP
    const transporter = this.getTransporter();

    if (!transporter) {
      const missingVars: string[] = [];
      if (!process.env.SMTP_HOST && !process.env.RESEND_API_KEY) missingVars.push('SMTP_HOST');
      if (!process.env.SMTP_USER && !process.env.RESEND_API_KEY) missingVars.push('SMTP_USER');
      if (!process.env.SMTP_PASS && !process.env.RESEND_API_KEY) missingVars.push('SMTP_PASS');

      console.error('[EMAIL_SMTP_CONFIG_ERROR] Falha ao disparar e-mail externo: Credenciais SMTP ausentes no servidor.', {
        destinatario: dto.recipientEmail,
        assunto: dto.subject,
        variaveisFaltantes: missingVars,
        instrucoes: 'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e MAIL_FROM no .env da VPS/Vercel.',
      });

      throw new BadRequestException(
        `E-mail registrado no banco VERSUS, mas NÃO foi disparado externamente: Credenciais SMTP ausentes no ambiente do servidor (${missingVars.join(', ')}). Configure o .env na VPS.`
      );
    }

    try {
      const fromAddress = process.env.SMTP_FROM || process.env.MAIL_FROM || (process.env.SMTP_USER ? `"${dto.senderName || 'VERSUS'}" <${process.env.SMTP_USER}>` : `"${dto.senderName || 'VERSUS'}" <${dto.senderEmail || 'comercial@versus.com.br'}>`);

      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
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
