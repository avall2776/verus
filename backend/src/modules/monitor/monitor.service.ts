import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class MonitorService {
  private readonly memoryCache = new Map<string, { data: any; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async getActiveConversations(tenantId: string) {
    const cacheKey = `monitor:active:${tenantId}`;
    const cached = this.memoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const conversations = await this.prisma.conversation.findMany({
      where: {
        tenantId,
        status: {
          in: ['waiting', 'human_takeover', 'open']
        }
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
        departmentId: true,
        assignedTo: true,
        contact: {
          select: { id: true, name: true, phone: true, source: true }
        },
        department: {
          select: { id: true, name: true, color: true }
        },
        messages: {
          select: { content: true, createdAt: true, fromMe: true },
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
    const assigneeIds = [...new Set(conversations.map(c => c.assignedTo).filter(Boolean))];
    const users = assigneeIds.length > 0 ? await this.prisma.user.findMany({
      where: { id: { in: assigneeIds as string[] } },
      select: { id: true, name: true }
    }) : [];
    
    const userMap = new Map(users.map(u => [u.id, u]));

    const result = conversations.map(c => ({
      ...c,
      assignee: c.assignedTo ? userMap.get(c.assignedTo) || null : null,
      lastMessage: c.messages[0] || null,
      lastMessageAt: c.messages[0]?.createdAt || c.updatedAt
    }));

    // Cache de 10s para responder instantaneamente (<1ms) durante a navegação
    this.memoryCache.set(cacheKey, { data: result, expiresAt: Date.now() + 10000 });
    return result;
  }

  clearCache(tenantId?: string) {
    if (tenantId) {
      this.memoryCache.delete(`monitor:active:${tenantId}`);
    } else {
      this.memoryCache.clear();
    }
  }
}
