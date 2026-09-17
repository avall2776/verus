import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { AiService } from '../ai/ai.service';

@UseGuards(JwtAuthGuard)
@Controller('agent')
export class AgentController {
  constructor(
    private agentService: AgentService,
    private aiService: AiService
  ) {}

  @Get('config')
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.agentService.getConfig(tenantId);
  }

  @Patch('config')
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body() body: any
  ) {
    return this.agentService.updateConfig(tenantId, body);
  }

  @Post('playground')
  async testPlayground(
    @CurrentTenant() tenantId: string,
    @Body() body: { messages: { role: 'user' | 'assistant', content: string }[], config: any }
  ) {
    // Process using AiService directly, with tenantId for RAG search and sanitized temperature
    const rawTemp = body.config?.aiTemperature !== undefined ? Number(body.config.aiTemperature) : 0.7;
    const safeTemp = isNaN(rawTemp) ? 0.7 : Math.min(Math.max(rawTemp, 0), 1.5);

    const configWithTenant = {
      ...body.config,
      id: tenantId,
      aiTemperature: safeTemp,
    };
    const result = await this.aiService.processConversation(body.messages, configWithTenant);
    return result;
  }
}
