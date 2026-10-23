import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async createContact(
    tenantId: string,
    data: { name: string; phone?: string; email?: string; source?: string; tags?: string[] },
  ) {
    return this.prisma.contact.create({
      data: {
        tenantId,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        source: data.source || 'Manual',
        tags: data.tags || ['Lead'],
      },
    });
  }

  async findAll(tenantId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      include: {
        deals: {
          select: {
            id: true,
            title: true,
            status: true,
            value: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    return contacts.map(c => {
      let tags = Array.isArray(c.tags) ? [...c.tags] : [];
      const deals = c.deals || [];

      // Análise de Negócios no CRM
      const wonDeals = deals.filter(d => d.status === 'won');
      const hasWonDeal = wonDeals.length > 0;
      const isClient = tags.includes('Cliente') || hasWonDeal;

      const activeDeals = deals.filter(d => 
        ['new', 'qualified', 'follow-up', 'proposal', 'negotiation', 'seed', 'ligacao-ativa'].includes(d.status)
      );
      const hasActiveDeals = activeDeals.length > 0;

      const lostDeals = deals.filter(d => ['lost', 'disqualified'].includes(d.status));
      const hasOnlyLostDeals = deals.length > 0 && lostDeals.length === deals.length;

      // Classificação Inteligente da Carteira
      let statusCategory: 'won' | 'hot' | 'cold' | 'lost' | 'collaborator' | 'partner' = 'cold';

      if (tags.some(t => t.toLowerCase() === 'colaborador')) {
        statusCategory = 'collaborator';
      } else if (tags.some(t => t.toLowerCase() === 'parceiro')) {
        statusCategory = 'partner';
      } else if (isClient) {
        statusCategory = 'won';
        if (!tags.includes('Cliente')) {
          tags.unshift('Cliente');
        }
        tags = tags.filter(t => t !== 'Frio' && t !== 'Não categorizado');
      } else if (hasActiveDeals || tags.some(t => ['quente', 'lead qualificado'].includes(t.toLowerCase()))) {
        statusCategory = 'hot';
        if (!tags.includes('Quente')) {
          tags.unshift('Quente');
        }
        tags = tags.filter(t => t !== 'Frio' && t !== 'Não categorizado');
      } else if (hasOnlyLostDeals || tags.some(t => t.toLowerCase().includes('desqualificado'))) {
        statusCategory = 'lost';
      } else {
        statusCategory = 'cold';
        if (!tags.includes('Frio') && !tags.some(t => ['Cliente', 'Quente', 'Lead'].includes(t))) {
          tags.push('Frio');
        }
      }

      // Remover 'Não categorizado' se já possui tags úteis
      if (tags.length > 1 && tags.includes('Não categorizado')) {
        tags = tags.filter(t => t !== 'Não categorizado');
      }

      // Totais financeiros (em R$)
      const totalWonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const totalActivePipelineValue = activeDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

      let avatarUrl = c.avatarUrl;
      if (!avatarUrl || avatarUrl === 'null' || avatarUrl === 'undefined' || avatarUrl.includes('unsplash.com')) {
        avatarUrl = null;
      }

      // White-labeling: garantia de remoção de 'Lero' e 'Versus', padronizando para 'Vallor'
      const cleanSource = (c.source || 'Vallor CRM')
        .replace(/lero\s*/gi, 'Vallor ')
        .replace(/versus\s*/gi, 'Vallor ')
        .trim();

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        source: cleanSource,
        avatarUrl,
        tags,
        statusCategory, // 'won' (Cliente que comprou) | 'hot' (Em negociação) | 'cold' (Frio) | 'lost' | 'collaborator' | 'partner'
        isClient,
        dealsCount: deals.length,
        totalWonValue,
        totalActivePipelineValue,
        deals: deals.map(d => ({
          id: d.id,
          title: d.title,
          status: d.status,
          value: Number(d.value) || 0,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        })),
        lastActive: c.updatedAt.toISOString(),
        createdAt: c.createdAt.toISOString()
      };
    });
  }

  async updateTags(tenantId: string, contactId: string, tags: string[]) {
    const contact = await this.prisma.contact.update({
      where: { id: contactId, tenantId },
      data: { tags }
    });

    // Se houve tag nova, vamos disparar o evento para a ultima tag adicionada (ou para todas)
    // Para simplificar, dispara evento TAG_ADDED para cada tag no novo array
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        await this.automationsService.evaluateEvent(tenantId, 'TAG_ADDED', { contactId, tag });
      }
    }

    return contact;
  }

  async updateContact(tenantId: string, contactId: string, data: { name?: string; phone?: string; email?: string }) {
    const existing = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId },
    });

    const updateData: any = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
    };

    if (data.phone && existing?.phone && existing.phone.includes('@lid') && !existing.whatsappLid) {
      updateData.whatsappLid = existing.phone;
    }

    const contact = await this.prisma.contact.update({
      where: { id: contactId, tenantId },
      data: updateData,
    });
    return contact;
  }
}
