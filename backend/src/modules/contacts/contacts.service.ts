import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

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
}
