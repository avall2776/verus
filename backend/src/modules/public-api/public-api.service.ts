import { Injectable, Logger, BadRequestException, Optional } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AutomationsService } from '../automations/automations.service';
import { CreateLeadDto } from './dto/create-lead.dto';

const DEFAULT_STAGES = [
  { id: "seed", name: "LEADS SEED", color: "#9ca3af", position: 0 },
  { id: "new", name: "Novo Contato", color: "#3b82f6", position: 1 },
  { id: "qualified", name: "Em Qualificação", color: "#a855f7", position: 2 },
  { id: "follow-up", name: "Follow-up", color: "#eab308", position: 3 },
  { id: "proposal", name: "Proposta", color: "#10b981", position: 4 },
  { id: "negotiation", name: "Negociação", color: "#f97316", position: 5 },
  { id: "won", name: "Fechado/Ganho", color: "#22c55e", position: 6 },
  { id: "lost", name: "Fechado/Perdido", color: "#e11d48", position: 7 },
  { id: "disqualified", name: "Duplicados/Desqualificados", color: "#4b5563", position: 8 }
];

@Injectable()
export class PublicApiService {
  private readonly logger = new Logger(PublicApiService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly chatGateway?: ChatGateway,
    @Optional() private readonly automationsService?: AutomationsService,
  ) {}

  /**
   * Normaliza número de telefone para formato internacional E.164 brasileiro
   */
  private normalizePhone(phoneRaw: string): string {
    let clean = phoneRaw.replace(/\D/g, '');
    if (!clean) return '';
    // Adiciona DDI 55 se vier apenas com DDD (10 ou 11 dígitos)
    if (clean.length === 10 || clean.length === 11) {
      clean = `55${clean}`;
    }
    // Garante o prefixo '+'
    return clean.startsWith('+') ? clean : `+${clean}`;
  }

  /**
   * Ingestão de Leads de Tráfego Pago (Meta Ads / Webhooks / Landing Pages)
   */
  async createLead(tenantId: string, dto: CreateLeadDto) {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('O campo "name" (nome do lead) é obrigatório.');
    }
    if (!dto.phone || !dto.phone.trim()) {
      throw new BadRequestException('O campo "phone" (telefone de contato) é obrigatório.');
    }

    const cleanPhone = this.normalizePhone(dto.phone);
    const source = dto.source || 'Meta Ads';
    const campaign = dto.campaign || dto.utm_campaign || null;

    // 1. Localiza ou Cria o Contato no Tenant
    let contact = await this.prisma.contact.findFirst({
      where: {
        tenantId,
        phone: cleanPhone,
      },
    });

    const tags = ['Lead', source];
    if (campaign) tags.push(campaign);

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          phone: cleanPhone,
          email: dto.email?.trim() || null,
          source,
          tags,
        },
      });
      this.logger.log(`Novo contato criado via API Pública: [${contact.id}] ${contact.name} (${contact.phone})`);
    } else {
      // Atualiza e-mail ou tags adicionais se aplicável
      const updatedTags = Array.from(new Set([...(contact.tags || []), ...tags]));
      contact = await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          email: dto.email?.trim() || contact.email,
          tags: updatedTags,
        },
      });
    }

    // 2. Valida responsável se fornecido
    let assignedUserId: string | null = null;
    const requestedAssignee = dto.assigned_to || dto.assigned_user_id;
    if (requestedAssignee) {
      const user = await this.prisma.user.findFirst({
        where: { id: requestedAssignee, tenantId },
      });
      if (user) {
        assignedUserId = user.id;
      }
    }

    // 3. Monta Metadados Ricos de Rastreamento (UTMs e Informações da Campanha)
    const metadata: Record<string, any> = {
      source,
      campaign,
      ad_name: dto.ad_name || null,
      adset_name: dto.adset_name || null,
      form_id: dto.form_id || null,
      utm_source: dto.utm_source || null,
      utm_medium: dto.utm_medium || null,
      utm_campaign: dto.utm_campaign || campaign,
      utm_content: dto.utm_content || null,
      utm_term: dto.utm_term || null,
      received_at: new Date().toISOString(),
      ingress: 'public_api_meta_ads',
      ...(dto.custom_fields || {}),
    };

    // 4. Cria a Oportunidade (Deal) no CRM Kanban
    const dealTitle = dto.title?.trim() || `${dto.name.trim()} - ${source}`;
    const dealValue = dto.value ? Number(dto.value) : 0;
    const stageId = dto.stage || 'new';

    const deal = await this.prisma.deal.create({
      data: {
        tenantId,
        contactId: contact.id,
        title: dealTitle,
        value: dealValue,
        status: stageId,
        notes: dto.notes || dto.description || `Lead recebido de ${source}${campaign ? ` (Campanha: ${campaign})` : ''}`,
        metadata,
        assignedTo: assignedUserId,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            source: true,
            tags: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 5. Cria ou Atualiza a Conversa no Inbox (colocando em 'waiting' para atendimento imediato)
    let conversation = await this.prisma.conversation.findUnique({
      where: {
        tenantId_contactId: {
          tenantId,
          contactId: contact.id,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          contactId: contact.id,
          status: 'waiting',
          assignedTo: assignedUserId,
        },
      });
    } else if (conversation.status === 'resolved' || conversation.status === 'closed') {
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'waiting',
          assignedTo: assignedUserId || conversation.assignedTo,
          updatedAt: new Date(),
        },
      });
    }

    // 6. Mensagem de Sistema / Registro de Entrada no Chat
    const initialContent = `📥 [Lead Tráfego Pago] Ingressou via ${source}${campaign ? ` - Campanha: "${campaign}"` : ''}${dto.ad_name ? ` (Anúncio: "${dto.ad_name}")` : ''}.`;
    
    await this.prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        contactId: contact.id,
        content: initialContent,
        type: 'text',
        isInternal: true,
        fromMe: false,
        direction: 'INBOUND',
        senderType: 'system',
        status: 'delivered',
      },
    }).catch(err => this.logger.warn(`Erro ao registrar mensagem inicial de lead: ${err.message}`));

    // 7. Notificação em Tempo Real via WebSocket (Socket.io)
    try {
      if (this.chatGateway?.server) {
        // Alerta de novo lead para operadores
        this.chatGateway.server.to(tenantId).emit('dealCreated', {
          id: deal.id,
          title: deal.title,
          value: deal.value,
          status: deal.status,
          contactName: contact.name,
          contactPhone: contact.phone,
          source,
          campaign,
        });

        this.chatGateway.server.to(tenantId).emit('dealUpdated', {
          id: deal.id,
          name: contact.name,
          title: deal.title,
          phone: contact.phone,
          value: deal.value,
          notes: deal.notes,
        });

        // Atualização da fila do Inbox
        this.chatGateway.server.to(tenantId).emit('conversationUpdated', {
          id: conversation.id,
          contactId: contact.id,
          status: conversation.status,
          assignedTo: conversation.assignedTo,
          contactName: contact.name,
          contactPhone: contact.phone,
        });
      }
    } catch (wsErr: any) {
      this.logger.warn(`Falha ao emitir socket event de lead: ${wsErr.message}`);
    }

    // 8. Disparo de Automações Configuradas no Tenant (trigger: DEAL_CREATED)
    try {
      if (this.automationsService) {
        this.automationsService.evaluateEvent(tenantId, 'DEAL_CREATED', {
          dealId: deal.id,
          contactId: contact.id,
          dealTitle: deal.title,
          dealValue: deal.value,
          stage: deal.status,
          source,
        }).catch(err => this.logger.warn(`Erro na automação DEAL_CREATED: ${err.message}`));
      }
    } catch (autoErr: any) {
      this.logger.warn(`Falha ao disparar automação: ${autoErr.message}`);
    }

    return {
      success: true,
      message: 'Lead ingerido com sucesso no CRM e disponibilizado para atendimento.',
      data: {
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          source: contact.source,
        },
        deal: {
          id: deal.id,
          title: deal.title,
          value: deal.value,
          stage: deal.status,
          assignedTo: deal.assignedTo,
          createdAt: deal.createdAt,
        },
        conversation: {
          id: conversation.id,
          status: conversation.status,
        },
      },
    };
  }

  /**
   * Retorna os funis e estágios disponíveis para o gestor de tráfego mapear o lead
   */
  async getFunnels(tenantId: string) {
    return {
      success: true,
      data: [
        {
          id: "default",
          name: "Funil Comercial Principal",
          description: "Funil padrão do CRM Kanban",
          is_default: true,
          stages: DEFAULT_STAGES,
        }
      ]
    };
  }

  /**
   * Retorna a lista de atendentes ativos para mapeamento de responsabilidade
   */
  async getUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Criação direta de contato
   */
  async createContact(tenantId: string, data: any) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('O campo "name" é obrigatório.');
    }
    const cleanPhone = data.phone ? this.normalizePhone(data.phone) : null;

    let contact = null;
    if (cleanPhone) {
      contact = await this.prisma.contact.findFirst({
        where: { tenantId, phone: cleanPhone },
      });
    }

    if (contact) {
      contact = await this.prisma.contact.update({
        where: { id: contact.id },
        data: {
          name: data.name.trim(),
          email: data.email || contact.email,
          tags: Array.from(new Set([...(contact.tags || []), ...(data.tags || [])])),
        },
      });
    } else {
      contact = await this.prisma.contact.create({
        data: {
          tenantId,
          name: data.name.trim(),
          phone: cleanPhone,
          email: data.email || null,
          source: data.source || 'API Externa',
          tags: data.tags || ['Contato'],
        },
      });
    }

    return {
      success: true,
      message: 'Contato processado com sucesso.',
      data: contact,
    };
  }

  /**
   * Criação direta de oportunidade (Deal)
   */
  async createDeal(tenantId: string, data: any) {
    if (!data.title || !data.title.trim()) {
      throw new BadRequestException('O campo "title" é obrigatório.');
    }
    if (!data.contact_id && !data.phone && !data.contact) {
      throw new BadRequestException('Informe contact_id, phone ou objeto contact para vincular a oportunidade.');
    }

    let contactId = data.contact_id;
    if (!contactId) {
      const phone = data.phone || data.contact?.phone;
      const cleanPhone = phone ? this.normalizePhone(phone) : null;
      let contact = cleanPhone ? await this.prisma.contact.findFirst({ where: { tenantId, phone: cleanPhone } }) : null;
      if (!contact) {
        contact = await this.prisma.contact.create({
          data: {
            tenantId,
            name: data.contact?.name || data.name || data.title,
            phone: cleanPhone,
            email: data.contact?.email || data.email || null,
            source: data.source || 'API Externa',
            tags: ['Lead'],
          },
        });
      }
      contactId = contact.id;
    }

    const deal = await this.prisma.deal.create({
      data: {
        tenantId,
        contactId,
        title: data.title.trim(),
        value: data.value ? Number(data.value) : 0,
        status: data.stage || data.status || 'new',
        notes: data.notes || data.description || null,
        metadata: data.metadata || {},
        assignedTo: data.assigned_to || data.assigned_user_id || null,
      },
    });

    return {
      success: true,
      message: 'Oportunidade criada com sucesso.',
      data: deal,
    };
  }
}
