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
   * Gera todas as variações de formato brasileiras (com +, sem +, com 9º dígito e sem 9º dígito)
   */
  private getPhoneVariants(phoneRaw?: string | null): string[] {
    if (!phoneRaw) return [];
    const clean = phoneRaw.replace(/\D/g, '');
    if (clean.length < 8) return [phoneRaw];
    const variants = new Set<string>();
    variants.add(clean);
    variants.add(`+${clean}`);
    if (clean.startsWith('55') && clean.length === 13) {
      const without9 = clean.slice(0, 4) + clean.slice(5);
      variants.add(without9);
      variants.add(`+${without9}`);
    } else if (clean.startsWith('55') && clean.length === 12) {
      const with9 = clean.slice(0, 4) + '9' + clean.slice(4);
      variants.add(with9);
      variants.add(`+${with9}`);
    } else if (clean.length === 11) {
      const with55 = `55${clean}`;
      variants.add(with55);
      variants.add(`+${with55}`);
      const without9 = `55${clean.slice(0, 2)}${clean.slice(3)}`;
      variants.add(without9);
      variants.add(`+${without9}`);
    } else if (clean.length === 10) {
      const with55 = `55${clean}`;
      variants.add(with55);
      variants.add(`+${with55}`);
      const with9 = `55${clean.slice(0, 2)}9${clean.slice(2)}`;
      variants.add(with9);
      variants.add(`+${with9}`);
    }
    return Array.from(variants);
  }

  /**
   * Identifica e resolve a Região/Departamento correto com base no DDD do telefone ou Estado (UF)
   */
  private async resolveDepartmentByPhone(tenantId: string, phone?: string | null, state?: string | null): Promise<string | null> {
    if (!phone && !state) return null;

    try {
      const departments = await this.prisma.department.findMany({
        where: { tenantId },
        select: { id: true, name: true }
      });
      if (!departments || departments.length === 0) return null;

      // Mapeamento exaustivo de todos os DDDs do Brasil (Anatel) para as 6 Regiões Comerciais
      const dddToRegion: Record<string, number> = {
        // Região 1 - Sul (RS, SC, PR) + Paraguai
        '51': 1, '53': 1, '54': 1, '55': 1,
        '47': 1, '48': 1, '49': 1,
        '41': 1, '42': 1, '43': 1, '44': 1, '45': 1, '46': 1,

        // Região 2 - Centro-Oeste / Norte (MS, MT, PA, RO, RR, AC, AM, AP)
        '67': 2, '65': 2, '66': 2,
        '91': 2, '93': 2, '94': 2, '69': 2, '95': 2, '68': 2, '92': 2, '97': 2, '96': 2,

        // Região 3 - Sudeste / Centro (GO, DF, MG, SP, RJ, ES)
        '62': 3, '64': 3, '61': 3,
        '31': 3, '32': 3, '33': 3, '34': 3, '35': 3, '37': 3, '38': 3,
        '11': 3, '12': 3, '13': 3, '14': 3, '15': 3, '16': 3, '17': 3, '18': 3, '19': 3,
        '21': 3, '22': 3, '24': 3, '27': 3, '28': 3,

        // Região 4 - Nordeste Sul (TO, BA)
        '63': 4, '71': 4, '73': 4, '74': 4, '75': 4, '77': 4,

        // Região 5 - Nordeste Meio-Norte (MA, PI)
        '98': 5, '99': 5, '86': 5, '89': 5,

        // Região 6 - Nordeste Setentrional (CE, RN, PB, SE, PE, AL)
        '85': 6, '88': 6, '84': 6, '83': 6, '79': 6, '81': 6, '87': 6, '82': 6
      };

      const ufToRegion: Record<string, number> = {
        'RS': 1, 'SC': 1, 'PR': 1,
        'MS': 2, 'MT': 2, 'PA': 2, 'RO': 2, 'RR': 2, 'AC': 2, 'AM': 2, 'AP': 2,
        'GO': 3, 'DF': 3, 'MG': 3, 'SP': 3, 'RJ': 3, 'ES': 3,
        'TO': 4, 'BA': 4,
        'MA': 5, 'PI': 5,
        'CE': 6, 'RN': 6, 'PB': 6, 'SE': 6, 'PE': 6, 'AL': 6
      };

      let targetRegionNum: number | null = null;

      // 1. Extração universal robusta de DDD (independente de ter DDI 55, ter ou não o 9º dígito)
      if (phone && !phone.includes('@lid')) {
        const clean = phone.replace(/\D/g, '');
        let ddd = '';
        if (clean.startsWith('595')) {
          targetRegionNum = 1;
        } else if (clean.length >= 10 && clean.length <= 13) {
          const localPart = clean.startsWith('55') && clean.length >= 12 ? clean.slice(2) : clean;
          if (localPart.length === 10 || localPart.length === 11) {
            ddd = localPart.substring(0, 2);
          } else if (clean.length === 10 || clean.length === 11) {
            ddd = clean.substring(0, 2);
          }
        }
        if (ddd && dddToRegion[ddd]) {
          targetRegionNum = dddToRegion[ddd];
        }
      }

      // 2. Fallback / Validação por Estado (UF)
      if (!targetRegionNum && state) {
        const uf = state.trim().toUpperCase();
        const byToken = departments.find(d => new RegExp(`(^|[^A-ZÀ-Ú])${uf}([^A-ZÀ-Ú]|$)`).test(d.name.toUpperCase()));
        if (byToken) return byToken.id;
        if (ufToRegion[uf]) targetRegionNum = ufToRegion[uf];
      }

      if (targetRegionNum) {
        const matched = departments.find(d => {
          const upper = d.name.toUpperCase();
          return upper.includes(`REGIÃO ${targetRegionNum}`) || upper.includes(`REGIAO ${targetRegionNum}`);
        });
        if (matched) return matched.id;
      }
    } catch (e: any) {
      this.logger.warn(`Erro ao resolver departamento por telefone: ${e.message}`);
    }

    return null;
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

    // 1. Localiza ou Cria o Contato no Tenant (buscando por todas as variações brasileiras de 8/9 dígitos)
    const phoneVariants = this.getPhoneVariants(dto.phone);
    let contact = await this.prisma.contact.findFirst({
      where: {
        tenantId,
        OR: phoneVariants.map(p => ({ phone: p })),
      },
      orderBy: [
        { conversations: { _count: 'desc' } },
        { updatedAt: 'desc' }
      ]
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
    
    // Garante que o lead sempre caia no início do Kanban ('seed' / LEADS SEED) por padrão
    let stageId = 'seed';
    if (dto.stage) {
      const s = dto.stage.trim().toLowerCase();
      if (s === 'seed' || s.includes('seed')) stageId = 'seed';
      else if (s === 'new' || s.includes('novo')) stageId = 'new';
      else if (s === 'qualified' || s.includes('qualifica')) stageId = 'qualified';
      else if (s === 'follow-up' || s.includes('follow')) stageId = 'follow-up';
      else if (s === 'proposal' || s.includes('proposta')) stageId = 'proposal';
      else if (s === 'negotiation' || s.includes('negocia')) stageId = 'negotiation';
      else stageId = dto.stage;
    }

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

    // 5. Determina a Região/Departamento automático por DDD ou Estado
    const targetDeptId = await this.resolveDepartmentByPhone(tenantId, cleanPhone, (dto as any).state || (dto.custom_fields as any)?.state || (dto.custom_fields as any)?.estado);

    // Cria ou Atualiza a Conversa no Inbox (colocando em 'waiting' para atendimento imediato)
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
          departmentId: targetDeptId,
          status: 'waiting',
          assignedTo: assignedUserId,
        },
      });
    } else {
      const updateData: any = {
        assignedTo: assignedUserId || conversation.assignedTo,
        updatedAt: new Date(),
      };
      if (conversation.status === 'resolved' || conversation.status === 'closed') {
        updateData.status = 'waiting';
      }
      if (!conversation.departmentId && targetDeptId) {
        updateData.departmentId = targetDeptId;
      }
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: updateData,
      });
    }

    // 6. Mensagem de Sistema / Registro de Entrada no Chat com dados completos do formulário
    const formRaw = (dto.notes || dto.description || '').trim();
    let initialContent = `📋 [LEAD TRÁFEGO PAGO] Ingressou via ${source}\n`;
    if (campaign) initialContent += `📢 Campanha: ${campaign}\n`;
    if (dto.ad_name) initialContent += `🎯 Anúncio: ${dto.ad_name}\n`;
    if (dto.email) initialContent += `📧 E-mail: ${dto.email}\n`;

    if (formRaw) {
      initialContent += `\n📝 Respostas do Formulário:\n${formRaw}`;
    }

    const createdMsg = await this.prisma.message.create({
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
    }).catch(err => {
      this.logger.warn(`Erro ao registrar mensagem inicial de lead: ${err.message}`);
      return null;
    });

    if (createdMsg && this.chatGateway) {
      this.chatGateway.emitNewMessage(tenantId, {
        ...createdMsg,
        contact: { phone: contact.phone, name: contact.name, avatarUrl: contact.avatarUrl }
      });
    }

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
    const phoneVariants = this.getPhoneVariants(data.phone);

    let contact = null;
    if (phoneVariants.length > 0) {
      contact = await this.prisma.contact.findFirst({
        where: {
          tenantId,
          OR: phoneVariants.map(p => ({ phone: p }))
        },
        orderBy: [
          { conversations: { _count: 'desc' } },
          { updatedAt: 'desc' }
        ]
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
      const phoneVariants = this.getPhoneVariants(phone);
      let contact = phoneVariants.length > 0 ? await this.prisma.contact.findFirst({
        where: {
          tenantId,
          OR: phoneVariants.map(p => ({ phone: p }))
        },
        orderBy: [
          { conversations: { _count: 'desc' } },
          { updatedAt: 'desc' }
        ]
      }) : null;
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
