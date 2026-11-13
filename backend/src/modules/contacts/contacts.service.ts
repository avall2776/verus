import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { GoogleContactsService } from './google-contacts.service';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);
  private readonly contactsCache = new Map<string, { data: any; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService,
    private readonly googleContactsService: GoogleContactsService,
  ) {}

  async createContact(
    tenantId: string,
    data: { name: string; phone?: string; email?: string; source?: string; tags?: string[] },
  ) {
    if (data.phone) {
      const clean = data.phone.replace(/\D/g, '');
      if (clean.length >= 8) {
        const variants = new Set<string>([clean, `+${clean}`]);
        if (clean.startsWith('55') && clean.length === 13) {
          const w9 = clean.slice(0, 4) + clean.slice(5);
          variants.add(w9);
          variants.add(`+${w9}`);
        } else if (clean.startsWith('55') && clean.length === 12) {
          const w9 = clean.slice(0, 4) + '9' + clean.slice(4);
          variants.add(w9);
          variants.add(`+${w9}`);
        }
        const existing = await this.prisma.contact.findFirst({
          where: {
            tenantId,
            OR: Array.from(variants).map(p => ({ phone: p }))
          },
          orderBy: [
            { conversations: { _count: 'desc' } },
            { updatedAt: 'desc' }
          ]
        });

        if (existing) {
          const updated = await this.prisma.contact.update({
            where: { id: existing.id },
            data: {
              ...(data.name && (!existing.name || existing.name.startsWith('WhatsApp')) ? { name: data.name.trim() } : {}),
              ...(data.email && !existing.email ? { email: data.email.trim().toLowerCase() } : {}),
              tags: Array.from(new Set([...(existing.tags || []), ...(data.tags || [])]))
            }
          });
          this.contactsCache.delete(tenantId);
          return updated;
        }
      }
    }

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
    this.contactsCache.delete(tenantId);
    if (contact.phone) {
      this.googleContactsService.syncContact(tenantId, contact).catch((err) => {
        this.logger.warn(`Erro ao sincronizar novo contato com Google: ${err.message}`);
      });
    }

    return contact;
  }

  async findAll(tenantId: string) {
    const cached = this.contactsCache.get(tenantId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const [contacts, departments] = await Promise.all([
      this.prisma.contact.findMany({
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
          },
          conversations: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              departmentId: true,
              assignedTo: true,
              department: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                }
              }
            }
          }
        }
      }),
      this.prisma.department.findMany({
        where: { tenantId },
        select: { id: true, name: true, color: true }
      })
    ]);

    const dddToUf: Record<string, string> = {
      '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
      '47': 'SC', '48': 'SC', '49': 'SC',
      '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
      '67': 'MS', '65': 'MT', '66': 'MT',
      '91': 'PA', '93': 'PA', '94': 'PA', '69': 'RO', '95': 'RR', '68': 'AC', '92': 'AM', '97': 'AM', '96': 'AP',
      '62': 'GO', '64': 'GO', '61': 'DF',
      '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
      '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
      '21': 'RJ', '22': 'RJ', '24': 'RJ', '27': 'ES', '28': 'ES',
      '63': 'TO', '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
      '98': 'MA', '99': 'MA', '86': 'PI', '89': 'PI',
      '85': 'CE', '88': 'CE', '84': 'RN', '83': 'PB', '79': 'SE', '81': 'PE', '87': 'PE', '82': 'AL'
    };

    const ufToRegion: Record<string, number> = {
      'RS': 1, 'SC': 1, 'PR': 1,
      'MS': 2, 'MT': 2, 'PA': 2, 'RO': 2, 'RR': 2, 'AC': 2, 'AM': 2, 'AP': 2,
      'GO': 3, 'MG': 3, 'SP': 3, 'DF': 3, 'RJ': 3, 'ES': 3,
      'TO': 4, 'BA': 4,
      'MA': 5, 'PI': 5,
      'CE': 6, 'RN': 6, 'PB': 6, 'SE': 6, 'PE': 6, 'AL': 6
    };

    const resolveContactDept = (phone?: string | null, state?: string | null) => {
      if (!departments.length) return null;
      let uf = state ? state.trim().toUpperCase() : '';
      if (!uf && phone && !phone.includes('@lid')) {
        const clean = phone.replace(/\D/g, '');
        let ddd = '';
        if (clean.startsWith('55') && clean.length >= 12) ddd = clean.substring(2, 4);
        else if (clean.length === 10 || clean.length === 11) ddd = clean.substring(0, 2);
        if (ddd && dddToUf[ddd]) uf = dddToUf[ddd];
        else if (clean.startsWith('595')) uf = 'RS';
      }
      if (!uf) return null;

      const byToken = departments.find(d => {
        const upper = d.name.toUpperCase();
        return new RegExp(`(^|[^A-ZÀ-Ú])${uf}([^A-ZÀ-Ú]|$)`).test(upper);
      });
      if (byToken) return byToken;

      const regNum = ufToRegion[uf];
      if (regNum) {
        return departments.find(d => {
          const upper = d.name.toUpperCase();
          return upper.includes(`REGIÃO ${regNum}`) || upper.includes(`REGIAO ${regNum}`);
        }) || null;
      }
      return null;
    };

    const result = contacts.map(c => {
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

      const latestConv = (c as any).conversations?.[0] || null;
      const resolvedDepartment = latestConv?.department || resolveContactDept(c.phone, c.state);

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
        departmentId: resolvedDepartment?.id || latestConv?.departmentId || null,
        department: resolvedDepartment || null,
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

    this.contactsCache.set(tenantId, { data: result, expiresAt: Date.now() + 20000 });
    return result;
  }

  async updateTags(tenantId: string, contactId: string, tags: string[]) {
    this.contactsCache.delete(tenantId);
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
    this.contactsCache.delete(tenantId);
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
   * Gera o arquivo vCard (.vcf) completo com todos os contatos da empresa
   */
  async generateVcf(tenantId: string): Promise<string> {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      select: { id: true, name: true, phone: true, email: true, address: true, whatsappLid: true },
      orderBy: { createdAt: 'desc' },
    });

    const vcards: string[] = [];

    for (const c of contacts) {
      // Descarta apenas grupos do WhatsApp (IDs como 12036...)
      const digits = (c.phone || '').replace(/\D/g, '');
      if (digits.startsWith('12036')) continue;

      const formatted = this.googleContactsService.sanitizePhone(c.phone);
      const displayName = this.googleContactsService.formatDisplayName(c.name, formatted || c.email || 'Cliente');

      let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
      vcard += `FN:${displayName}\r\n`;
      vcard += `N:;${displayName};;;\r\n`;
      vcard += 'ORG:Verto Soluções Agrícolas\r\n';

      if (formatted) {
        vcard += `TEL;TYPE=CELL:${formatted}\r\n`;
        if (c.phone && c.phone.includes('@lid')) {
          vcard += `NOTE:WhatsApp LID: ${c.phone}\r\n`;
        }
      }

      if (c.email) vcard += `EMAIL:${c.email.trim()}\r\n`;
      if (c.address) vcard += `NOTE:Endereço: ${c.address.replace(/[\r\n;]/g, ' ')}\r\n`;
      vcard += 'END:VCARD\r\n';

      vcards.push(vcard);
    }

    return vcards.join('');
  }
}
