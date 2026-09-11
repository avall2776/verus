import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService
  ) {}

  async findAll(tenantId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      include: {
        deals: true
      }
    });

    return contacts.map(c => {
      let tags = c.tags || [];
      if (c.deals.length > 0 && !tags.includes('Quente')) {
        tags.push('Quente');
      } else if (c.deals.length === 0 && !tags.includes('Frio')) {
        tags.push('Frio');
      }

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        source: c.source,
        tags,
        lastActive: c.updatedAt.toISOString()
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
}
