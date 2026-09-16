import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { SendEmailDto } from './dto/send-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

@Injectable()
export class EmailsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Verificar se o tenant já possui e-mails no banco. Se não tiver, criar semente inicial realista.
    const countTotal = await this.prisma.emailMessage.count({ where: { tenantId } });
    if (countTotal === 0) {
      await this.seedInitialEmails(tenantId);
    }

    const where: any = { tenantId };

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
    const [inbox, unread, starred, sent, draft, trash, archive] = await Promise.all([
      this.prisma.emailMessage.count({ where: { tenantId, folder: 'INBOX' } }),
      this.prisma.emailMessage.count({ where: { tenantId, folder: 'INBOX', isRead: false } }),
      this.prisma.emailMessage.count({ where: { tenantId, isStarred: true } }),
      this.prisma.emailMessage.count({ where: { tenantId, folder: 'SENT' } }),
      this.prisma.emailMessage.count({ where: { tenantId, folder: 'DRAFT' } }),
      this.prisma.emailMessage.count({ where: { tenantId, folder: 'TRASH' } }),
      this.prisma.emailMessage.count({ where: { tenantId, folder: 'ARCHIVE' } }),
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
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId },
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
    const preview = dto.bodyText.slice(0, 140);
    const bodyHtml = dto.bodyHtml || `<p>${dto.bodyText.replace(/\n/g, '<br/>')}</p>`;
    const hasAttachments = Boolean(dto.attachments && Array.isArray(dto.attachments) && dto.attachments.length > 0);

    const email = await this.prisma.emailMessage.create({
      data: {
        tenantId,
        recipientEmail: dto.recipientEmail,
        recipientName: dto.recipientName || dto.recipientEmail.split('@')[0],
        senderName: dto.senderName || 'Atendimento Comercial VERSUS',
        senderEmail: dto.senderEmail || 'comercial@versus.com.br',
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

    return email;
  }

  async updateEmail(tenantId: string, id: string, dto: UpdateEmailDto) {
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId },
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
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId },
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
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId },
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
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, tenantId },
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
      await this.prisma.emailMessage.create({ data: em });
    }
  }
}
