import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class MonitorService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveConversations(tenantId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        tenantId,
        status: {
          in: ['waiting', 'human_takeover', 'open']
        }
      },
      include: {
        contact: true,
        department: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      // Ordena por quem foi atualizado primeiro (quem está esperando há mais tempo)
      orderBy: {
        updatedAt: 'asc'
      }
    });

    // Resolve as entidades de usuário (assignees) para preencher a resposta
    const assigneeIds = [...new Set(conversations.map(c => c.assignedTo).filter(id => id))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } }
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));

    return conversations.map(c => ({
      ...c,
      assignee: c.assignedTo ? userMap.get(c.assignedTo) || null : null,
      lastMessage: c.messages[0] || null
    }));
  }
}
