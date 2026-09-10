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
    @Body() body: { messages: { role: 'user' | 'assistant', content: string }[], config: any }
  ) {
    // Process using AiService directly, without saving anything or linking to CRM
    const result = await this.aiService.processConversation(body.messages, body.config);
    return result;
  }
}
