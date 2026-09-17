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
    const rawTemp = data.aiTemperature !== undefined ? parseFloat(String(data.aiTemperature)) : 0.7;
    const safeTemp = isNaN(rawTemp) ? 0.7 : Math.min(Math.max(rawTemp, 0), 1.5);
    const safeModel = (data.aiModel === 'gpt-4o' || data.aiModel === 'gpt-4o-mini') ? data.aiModel : 'gpt-4o-mini';

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        aiName: data.aiName,
        aiModel: safeModel,
        aiPrompt: data.aiPrompt,
        aiKnowledgeBase: data.aiKnowledgeBase,
        aiTemperature: safeTemp,
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
