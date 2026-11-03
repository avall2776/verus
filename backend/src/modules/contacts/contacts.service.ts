import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { GoogleContactsService } from './google-contacts.service';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService,
    private readonly googleContactsService: GoogleContactsService,
  ) {}

  async createContact(
    tenantId: string,
    data: { name: string; phone?: string; email?: string; source?: string; tags?: string[] },
  ) {
    const contact = await this.prisma.contact.create({
      data: {
        tenantId,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        source: data.source || 'Manual',
        tags: data.tags || ['Lead'],
      },
    });

    // Sincronização automática em segundo plano com a agenda (Google Contatos)
    if (contact.phone) {
      this.googleContactsService.syncContact(tenantId, contact).catch((err) => {
        this.logger.warn(`Erro ao sincronizar novo contato com Google: ${err.message}`);
      });
    }

    return contact;
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

      // Análise de Negócios no CRM e Faturamento Omie ERP
      const wonDeals = deals.filter(d => d.status === 'won');
      const hasWonDeal = wonDeals.length > 0 || c.isFaturado;
      const isClient = tags.some(t => t.toLowerCase() === 'cliente') || hasWonDeal;

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
      const dealsWonValue = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const totalWonValue = dealsWonValue > 0 ? dealsWonValue : (Number(c.totalFaturado) || 0);
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
        cpfCnpj: c.cpfCnpj,
        razaoSocial: c.razaoSocial,
        nomeFantasia: c.nomeFantasia,
        inscricaoEstadual: c.inscricaoEstadual,
        cep: c.cep,
        address: c.address,
        number: c.number,
        complement: c.complement,
        neighborhood: c.neighborhood,
        city: c.city,
        state: c.state,
        isFaturado: c.isFaturado,
        totalFaturado: Number(c.totalFaturado) || 0,
        dataHealthScore: c.dataHealthScore || 0,
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

  async updateContact(tenantId: string, contactId: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    cpfCnpj?: string;
    razaoSocial?: string;
    nomeFantasia?: string;
    inscricaoEstadual?: string;
    cep?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }) {
    const existing = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId },
    });

    const updateData: any = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.cpfCnpj !== undefined && { cpfCnpj: data.cpfCnpj }),
      ...(data.razaoSocial !== undefined && { razaoSocial: data.razaoSocial }),
      ...(data.nomeFantasia !== undefined && { nomeFantasia: data.nomeFantasia }),
      ...(data.inscricaoEstadual !== undefined && { inscricaoEstadual: data.inscricaoEstadual }),
      ...(data.cep !== undefined && { cep: data.cep }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.number !== undefined && { number: data.number }),
      ...(data.complement !== undefined && { complement: data.complement }),
      ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.state !== undefined && { state: data.state }),
    };

    if (data.phone && existing?.phone && existing.phone.includes('@lid') && !existing.whatsappLid) {
      updateData.whatsappLid = existing.phone;
    }

    // Recalcular dataHealthScore se dados cadastrais foram informados
    const phoneVal = data.phone !== undefined ? data.phone : existing?.phone;
    const cpfVal = data.cpfCnpj !== undefined ? data.cpfCnpj : existing?.cpfCnpj;
    const addrVal = data.address !== undefined ? data.address : existing?.address;
    const cepVal = data.cep !== undefined ? data.cep : existing?.cep;
    const emailVal = data.email !== undefined ? data.email : existing?.email;

    let score = 0;
    if (phoneVal && phoneVal.replace(/\D/g, '').length >= 8) score += 25;
    if (cpfVal && cpfVal.replace(/\D/g, '').length >= 11) score += 25;
    if ((addrVal && addrVal.length >= 3) || (cepVal && cepVal.replace(/\D/g, '').length === 8)) score += 25;
    if (emailVal && emailVal.includes('@')) score += 25;
    updateData.dataHealthScore = score;

    const contact = await this.prisma.contact.update({
      where: { id: contactId, tenantId },
      data: updateData,
    });

    // Sincronização automática em segundo plano caso o telefone seja elegível (não @lid)
    if (contact.phone) {
      this.googleContactsService.syncContact(tenantId, contact).catch((err) => {
        this.logger.warn(`Erro ao sincronizar contato atualizado com Google: ${err.message}`);
      });
    }

    return contact;
  }

  /**
   * Gera o arquivo vCard (.vcf) completo com todos os contatos elegíveis da empresa
   */
  async generateVcf(tenantId: string): Promise<string> {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      select: { id: true, name: true, phone: true, email: true, address: true },
    });

    const seenPhones = new Set<string>();
    const vcards: string[] = [];

    for (const c of contacts) {
      const formatted = this.googleContactsService.sanitizePhone(c.phone);
      if (!formatted || seenPhones.has(formatted)) continue;
      seenPhones.add(formatted);

      const displayName = this.googleContactsService.formatDisplayName(c.name, formatted);

      let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
      vcard += `FN:${displayName}\r\n`;
      vcard += `N:;${displayName};;;\r\n`;
      vcard += `TEL;TYPE=CELL:${formatted}\r\n`;
      vcard += 'ORG:Verto Soluções Agrícolas\r\n';
      if (c.email) vcard += `EMAIL:${c.email.trim()}\r\n`;
      if (c.address) vcard += `NOTE:Endereço: ${c.address.replace(/[\r\n;]/g, ' ')}\r\n`;
      vcard += 'END:VCARD\r\n';

      vcards.push(vcard);
    }

    return vcards.join('');
  }
}
