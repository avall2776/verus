import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: { 
    status?: string; 
    priority?: string; 
    category?: string; 
    search?: string; 
    userId?: string;
    isSuperAdmin?: boolean;
    targetTenantId?: string;
  }) {
    const where: any = {};

    if (filters.isSuperAdmin) {
      if (filters.targetTenantId && filters.targetTenantId !== 'ALL') {
        where.tenantId = filters.targetTenantId;
      }
    } else {
      where.tenantId = tenantId;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.priority && filters.priority !== 'ALL') {
      where.priority = filters.priority;
    }

    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const countWhere = { ...where };
    delete countWhere.status;

    const [tickets, total, open, inProgress, waitingClient, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              cnpj: true,
              email: true,
              phone: true,
              isActive: true,
              plan: { select: { name: true } }
            }
          },
          user: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true }
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true }
          },
          contact: {
            select: { id: true, name: true, phone: true, email: true }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      this.prisma.supportTicket.count({ where: countWhere }),
      this.prisma.supportTicket.count({ where: { ...countWhere, status: 'OPEN' } }),
      this.prisma.supportTicket.count({ where: { ...countWhere, status: 'IN_PROGRESS' } }),
      this.prisma.supportTicket.count({ where: { ...countWhere, status: 'WAITING_CLIENT' } }),
      this.prisma.supportTicket.count({ where: { ...countWhere, status: 'RESOLVED' } }),
      this.prisma.supportTicket.count({ where: { ...countWhere, status: 'CLOSED' } }),
    ]);

    return {
      tickets,
      counts: {
        total,
        open,
        inProgress,
        waitingClient,
        resolved,
        closed
      }
    };
  }

  async findOne(id: string, tenantId: string, isSuperAdmin?: boolean) {
    const where = isSuperAdmin ? { id } : { id, tenantId };

    const ticket = await this.prisma.supportTicket.findFirst({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            email: true,
            phone: true,
            address: true,
            logoUrl: true,
            isActive: true,
            createdAt: true,
            plan: { select: { id: true, name: true, price: true } },
            whatsappSettings: true,
            emailSettings: true,
            metaPhoneNumberId: true,
            _count: {
              select: {
                users: true,
                contracts: true,
                contacts: true,
                supportTickets: true,
              }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        },
        contact: {
          select: { id: true, name: true, phone: true, email: true }
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, email: true, role: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado.');
    }

    return ticket;
  }

  async create(tenantId: string, userId: string, dto: CreateTicketDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true }
    });

    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject: dto.subject.trim(),
        description: dto.description.trim(),
        category: dto.category || 'DUVIDA_TECNICA',
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        tenantId,
        userId,
        contactId: dto.contactId || null,
        messages: {
          create: {
            senderId: userId,
            senderName: user?.name || 'Solicitante',
            senderRole: user?.role || 'USER',
            content: dto.description.trim(),
            isInternal: false
          }
        }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        },
        messages: true
      }
    });

    return ticket;
  }

  async addMessage(
    ticketId: string, 
    tenantId: string, 
    userId: string, 
    dto: CreateTicketMessageDto,
    isSuperAdmin?: boolean
  ) {
    const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };

    const ticket = await this.prisma.supportTicket.findFirst({
      where,
      include: { user: true }
    });

    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado.');
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true }
    });

    const isInternal = Boolean(dto.isInternal);
    const senderRole = isSuperAdmin ? 'SUPER_ADMIN' : (sender?.role || 'AGENT');

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        senderName: sender?.name || (isSuperAdmin ? 'Super Admin' : 'Operador'),
        senderRole,
        content: dto.content.trim(),
        isInternal,
        attachments: dto.attachments || null
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        }
      }
    });

    // Se o chamado estava fechado ou resolvido e recebe mensagem pública, reabre
    let nextStatus = ticket.status;
    if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      nextStatus = 'IN_PROGRESS';
    } else if (!isInternal) {
      if (isSuperAdmin || sender?.role === 'ADMIN' || sender?.role === 'AGENT') {
        nextStatus = 'WAITING_CLIENT';
      } else {
        nextStatus = 'IN_PROGRESS';
      }
    }

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        updatedAt: new Date()
      }
    });

    return message;
  }

  async updateStatus(ticketId: string, tenantId: string, status: string, isSuperAdmin?: boolean) {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Status inválido. Escolha entre: ${validStatuses.join(', ')}`);
    }

    const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };

    const ticket = await this.prisma.supportTicket.findFirst({ where });

    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado.');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        }
      }
    });
  }

  async assign(ticketId: string, tenantId: string, assignedToId: string | null, isSuperAdmin?: boolean) {
    const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };

    const ticket = await this.prisma.supportTicket.findFirst({ where });

    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado.');
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: assignedToId || null,
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
        updatedAt: new Date()
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true }
        }
      }
    });
  }

  async getNotices(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        whatsappSettings: true,
        emailSettings: true,
        metaPhoneNumberId: true,
        plan: { select: { name: true } },
      }
    });

    const isWhatsappActive = Boolean(tenant?.metaPhoneNumberId || tenant?.whatsappSettings);
    const isEmailActive = Boolean(tenant?.emailSettings);

    return {
      systemStatus: [
        {
          id: 'ai-vitor',
          name: 'IA Vitor Online',
          status: 'OPERATIONAL',
          label: 'Motor OpenAI / LangChain Ativo',
          indicator: 'healthy'
        },
        {
          id: 'whatsapp',
          name: 'WhatsApp Cloud API',
          status: isWhatsappActive ? 'OPERATIONAL' : 'CONFIG_REQUIRED',
          label: isWhatsappActive ? 'Linha Operacional Conectada' : 'Aguardando Pareamento',
          indicator: isWhatsappActive ? 'healthy' : 'warning'
        },
        {
          id: 'email-smtp',
          name: 'Servidor de E-mail SMTP',
          status: isEmailActive ? 'OPERATIONAL' : 'PENDING_SETUP',
          label: isEmailActive ? 'Transporte Conectado' : 'Configuração Opcional',
          indicator: isEmailActive ? 'healthy' : 'neutral'
        },
        {
          id: 'cloud-infra',
          name: 'Infraestrutura Cloud VERSUS',
          status: 'OPERATIONAL',
          label: 'Latência Estável • 99.9% Uptime',
          indicator: 'healthy'
        }
      ],
      announcements: [
        {
          id: 'release-v24',
          title: 'Versão 2.4: Suporte Flutuante & Suíte Comercial',
          badge: 'Novidade',
          date: '17/09/2026',
          description: 'Widget de Suporte Versus agora integrado em todas as telas da plataforma para consulta de chamados, status do ecossistema e suporte imediato.'
        },
        {
          id: 'quick-tips',
          title: 'Produtividade: Atalho de Macros no Chat',
          badge: 'Dica Rápida',
          date: '16/09/2026',
          description: 'Digite "/" no campo de mensagem do WhatsApp para acessar suas Respostas Rápidas instantaneamente e otimizar seu tempo de atendimento.'
        },
        {
          id: 'security-mp',
          title: 'Contratos e Propostas com Assinatura Digital Válida',
          badge: 'Jurídico & Compliance',
          date: '15/09/2026',
          description: 'Emissão e assinatura eletrônica em total conformidade com a MP 2.200-2/2001 e Lei 14.063/2020 com trilha de auditoria completa por IP e carimbo de tempo.'
        }
      ]
    };
  }
}

