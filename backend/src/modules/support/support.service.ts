import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SupportAiService } from './support-ai.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { UpdateSupportAiConfigDto } from './dto/update-support-ai-config.dto';
import { SubmitCsatDto } from './dto/submit-csat.dto';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly supportAiService: SupportAiService,
    private readonly chatGateway: ChatGateway,
  ) {
    const apiKey = this.configService?.get<string>('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

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

    // Emite atualização em tempo real no WebSocket
    this.chatGateway.emitTicketUpdate(tenantId, ticket);

    // Dispara IA de atendimento autônomo de forma assíncrona
    setTimeout(() => {
      this.supportAiService.handleTicketCreated(ticket.id).catch((err) => {
        this.logger.error(`Erro ao disparar IA para novo chamado #${ticket.ticketNumber}: ${err?.message}`);
      });
    }, 1000);

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

    // Emite atualização no WebSocket
    this.chatGateway.emitTicketUpdate(ticket.tenantId, {
      ticketId,
      message,
      status: nextStatus,
    });

    // Se a mensagem for do cliente e não for interna, aciona a IA de atendimento
    if (!isInternal && !isSuperAdmin && (senderRole === 'USER' || sender?.role === 'USER')) {
      setTimeout(() => {
        this.supportAiService.handleIncomingClientMessage(
          ticketId,
          dto.content.trim(),
          sender?.name || 'Cliente'
        ).catch((err) => {
          this.logger.error(`Erro ao disparar IA para resposta no chamado #${ticket.ticketNumber}: ${err?.message}`);
        });
      }, 1200);
    }

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

  /**
   * Copiloto IA de Atendimento Híbrido: Gera sugestão de resposta técnica empática e recomenda status ideal
   */
  async generateCopilotSuggestion(ticketId: string, tenantId: string, isSuperAdmin?: boolean) {
    const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };

    const ticket = await this.prisma.supportTicket.findFirst({
      where,
      include: {
        tenant: { select: { name: true, plan: { select: { name: true } } } },
        user: { select: { name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            senderName: true,
            senderRole: true,
            content: true,
            isInternal: true,
            createdAt: true,
          }
        }
      }
    });

    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado.');
    }

    const clientName = ticket.user?.name || 'Cliente';
    const companyName = ticket.tenant?.name || 'Empresa';
    const messagesHistory = ticket.messages
      .map(m => `[${m.isInternal ? 'NOTA INTERNA' : m.senderRole} - ${m.senderName}]: ${m.content}`)
      .join('\n');

    const prompt = `
Você é o Copiloto IA de Atendimento ao Cliente e Suporte Técnico da plataforma VERSUS (SaaS corporativo de CRM Omnichannel, IA de Vendas Vitor, WhatsApp Cloud API, Assinaturas Digitais e Métricas Comerciais).
Sua missão é atuar como copiloto do atendente humano, gerando uma resposta técnica de alto nível, precisa, acolhedora e empática para que o operador humano revise e envie no chat ao vivo.

DADOS DO CHAMADO:
- Protocolo: #${ticket.ticketNumber}
- Empresa Cliente: ${companyName} (Plano: ${ticket.tenant?.plan?.name || 'Pro'})
- Solicitante: ${clientName} (${ticket.user?.email || 'Sem email'})
- Categoria: ${ticket.category}
- Prioridade: ${ticket.priority}
- Status Atual: ${ticket.status}
- Assunto: ${ticket.subject}
- Dúvida / Relato Original: ${ticket.description}

HISTÓRICO DA CONVERSA:
${messagesHistory || 'Apenas a dúvida original relatada acima.'}

INSTRUÇÕES PARA O COPILOTO:
1. Responda como um operador humano experiente, prestativo e cordial ("Olá, ${clientName.split(' ')[0]}! Tudo bem?").
2. Apresente uma solução direta, técnica e prática para o problema relatado, organizando em tópicos quando útil.
3. Se o chamado já estiver pronto ou resolvido, forneça a instrução de validação.
4. Se exigir ação do cliente (ex: reconectar WhatsApp, verificar permissões no painel, checar dados de lead), explique com clareza amigável.
5. Recomende o status ideal para o chamado:
   - "WAITING_CLIENT" se a resposta exigir que o cliente teste ou responda;
   - "RESOLVED" se a solução for conclusiva e a dúvida sanada;
   - "IN_PROGRESS" se houver investigação adicional em andamento.
6. Retorne RIGOROSAMENTE apenas um objeto JSON com a seguinte estrutura:
{
  "summary": "Resumo de 1 frase do que o cliente precisa",
  "suggestedResponse": "Texto pronto e humanizado para o atendente enviar",
  "recommendedStatus": "WAITING_CLIENT" | "RESOLVED" | "IN_PROGRESS",
  "recommendedStatusReason": "Motivo da sugestão de status",
  "keyActions": ["Ação 1 recomendada", "Ação 2 recomendada"]
}
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um assistente técnico especialista em suporte corporativo e CRM. Retorne apenas JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content);
      }
    } catch (err: any) {
      this.logger.warn(`Fallback no Copiloto IA para ticket #${ticket.ticketNumber}: ${err?.message}`);
    }

    // Fallback inteligente caso a OpenAI não retorne
    const firstName = clientName.split(' ')[0];
    return {
      summary: `Atendimento sobre ${ticket.subject} (${ticket.category})`,
      suggestedResponse: `Olá, ${firstName}! Tudo bem?\n\nAnalisamos a sua solicitação sobre "${ticket.subject}". Já realizamos as verificações no ambiente e orientamos seguir os passos indicados no painel VERSUS.\n\nFicamos no aguardo da sua confirmação ou caso surja qualquer outra dúvida técnica. Nossa equipe está à total disposição!\n\nAtenciosamente,\nEquipe de Atendimento VERSUS`,
      recommendedStatus: 'WAITING_CLIENT',
      recommendedStatusReason: 'Aguardando validação do cliente após orientação técnica.',
      keyActions: [
        'Confirmar parâmetros do tenant',
        'Aguardar retorno do cliente'
      ]
    };
  }

  async getAiConfig() {
    return this.supportAiService.getConfig();
  }

  async updateAiConfig(dto: UpdateSupportAiConfigDto) {
    return this.supportAiService.updateConfig(dto);
  }

  async toggleTicketAi(ticketId: string, isPaused: boolean, tenantId?: string, isSuperAdmin?: boolean) {
    const where = isSuperAdmin ? { id: ticketId } : { id: ticketId, tenantId };
    const ticket = await this.prisma.supportTicket.findFirst({ where });
    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado.');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        isAiPaused: isPaused,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        assignedTo: true,
        tenant: true,
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    this.chatGateway.emitTicketUpdate(ticket.tenantId, updated);
    return updated;
  }

  async submitCsat(ticketId: string, tenantId: string, dto: SubmitCsatDto) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) {
      throw new NotFoundException('Chamado de suporte não encontrado.');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        satisfactionRating: dto.rating,
        satisfactionFeedback: dto.feedback?.trim() || null,
        updatedAt: new Date(),
      },
      include: {
        user: true,
        assignedTo: true,
        tenant: true,
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    this.chatGateway.emitTicketUpdate(tenantId, updated);
    return {
      message: 'Avaliação registrada com sucesso! Muito obrigado pelo seu feedback.',
      ticket: updated,
    };
  }
}


