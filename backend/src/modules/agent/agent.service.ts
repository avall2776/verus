import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  async getConfig(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        aiName: true,
        aiModel: true,
        aiPrompt: true,
        aiKnowledgeBase: true,
        aiTemperature: true,
      }
    });
    return tenant;
  }

  async updateConfig(tenantId: string, data: any) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiName: data.aiName,
        aiModel: data.aiModel,
        aiPrompt: data.aiPrompt,
        aiKnowledgeBase: data.aiKnowledgeBase,
        aiTemperature: parseFloat(data.aiTemperature),
      },
      select: {
        aiName: true,
        aiModel: true,
        aiPrompt: true,
        aiKnowledgeBase: true,
        aiTemperature: true,
      }
    });
  }
}
