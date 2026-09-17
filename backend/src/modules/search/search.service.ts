import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface GlobalSearchResult {
  leads: Array<{
    id: string;
    title: string;
    value: number;
    status: string;
    contactName: string;
    contactPhone?: string;
    href: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    conversationId?: string;
    href: string;
  }>;
  team: Array<{
    id: string;
    name: string;
    email?: string;
    role: string;
    isOnline: boolean;
    href: string;
  }>;
  total: number;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(tenantId: string, query: string): Promise<GlobalSearchResult> {
    if (!query || query.trim().length < 2) {
      return { leads: [], contacts: [], team: [], total: 0 };
    }

    const cleanQuery = query.trim();

    try {
      const [deals, contacts, teamUsers] = await Promise.all([
        // 1. Busca Leads / Deals no Funil Comercial (CRM)
        this.prisma.deal.findMany({
          where: {
            tenantId,
            OR: [
              { title: { contains: cleanQuery, mode: 'insensitive' } },
              { contact: { name: { contains: cleanQuery, mode: 'insensitive' } } },
              { contact: { phone: { contains: cleanQuery, mode: 'insensitive' } } },
              { contact: { email: { contains: cleanQuery, mode: 'insensitive' } } },
            ],
          },
          take: 6,
          orderBy: { updatedAt: 'desc' },
          include: {
            contact: {
              select: { name: true, phone: true }
            }
          }
        }),

        // 2. Busca Contatos e Conversas do Atendimento (WhatsApp / Inbox)
        this.prisma.contact.findMany({
          where: {
            tenantId,
            OR: [
              { name: { contains: cleanQuery, mode: 'insensitive' } },
              { phone: { contains: cleanQuery, mode: 'insensitive' } },
              { email: { contains: cleanQuery, mode: 'insensitive' } },
            ],
          },
          take: 6,
          orderBy: { updatedAt: 'desc' },
          include: {
            conversations: {
              take: 1,
              orderBy: { updatedAt: 'desc' },
              select: { id: true, status: true, updatedAt: true }
            }
          }
        }),

        // 3. Busca Colaboradores da Equipe
        this.prisma.user.findMany({
          where: {
            tenantId,
            isActive: true,
            OR: [
              { name: { contains: cleanQuery, mode: 'insensitive' } },
              { email: { contains: cleanQuery, mode: 'insensitive' } },
              { role: { contains: cleanQuery, mode: 'insensitive' } },
            ],
          },
          take: 4,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isOnline: true
          }
        })
      ]);

      const formattedLeads = deals.map(d => ({
        id: d.id,
        title: d.title || d.contact?.name || 'Oportunidade',
        value: Number(d.value || 0),
        status: d.status,
        contactName: d.contact?.name || 'Sem contato',
        contactPhone: d.contact?.phone || undefined,
        href: `/crm`
      }));

      const formattedContacts = contacts.map(c => ({
        id: c.id,
        name: c.name || c.phone || 'Contato',
        phone: c.phone || '',
        email: c.email || undefined,
        conversationId: c.conversations?.[0]?.id,
        href: `/inbox`
      }));

      const formattedTeam = teamUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email || undefined,
        role: u.role,
        isOnline: Boolean(u.isOnline),
        href: `/chat-interno`
      }));

      const total = formattedLeads.length + formattedContacts.length + formattedTeam.length;

      return {
        leads: formattedLeads,
        contacts: formattedContacts,
        team: formattedTeam,
        total
      };
    } catch (error) {
      this.logger.error('Erro ao executar busca global:', error);
      return { leads: [], contacts: [], team: [], total: 0 };
    }
  }
}
