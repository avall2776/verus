import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../shared/guards/plan.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { AiService } from '../ai/ai.service';

@UseGuards(JwtAuthGuard, PlanGuard)
@RequireModule('aiAgent')
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

  @Get('training-logs')
  async getTrainingLogs(@CurrentTenant() tenantId: string) {
    return this.agentService.getTrainingLogs(tenantId);
  }

  @Post('coach')
  async coachAgent(
    @CurrentTenant() tenantId: string,
    @Body() body: { feedback: string; quotedText?: string },
    @Request() req: any
  ) {
    const user = req.user;
    const userName = user?.name || (user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador');
    return this.agentService.coachAgent(tenantId, body, user?.id, userName);
  }

  // --- Ciclo de Aprendizado Contínuo & Radar de Sentimentos (Fase 86) ---

  @Get('learning-incidents')
  async getLearningIncidents(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.agentService.getLearningIncidents(tenantId, status);
  }

  @Post('learning-incidents/:id/apply')
  async applyLearningIncident(
    @CurrentTenant() tenantId: string,
    @Param('id') incidentId: string,
    @Request() req: any,
  ) {
    const user = req.user;
    const userName = user?.name || (user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador');
    return this.agentService.applyLearningIncident(tenantId, incidentId, user?.id, userName);
  }

  @Patch('learning-incidents/:id/dismiss')
  async dismissLearningIncident(
    @CurrentTenant() tenantId: string,
    @Param('id') incidentId: string,
  ) {
    return this.agentService.dismissLearningIncident(tenantId, incidentId);
  }

  @Post('playground')
  async testPlayground(
    @CurrentTenant() tenantId: string,
    @Body() body: { messages: { role: 'user' | 'assistant', content: string }[], config: any }
  ) {
    // Process using AiService directly, with tenantId for RAG search and sanitized temperature
    const rawTemp = body.config?.aiTemperature !== undefined ? Number(body.config.aiTemperature) : 0.7;
    const safeTemp = isNaN(rawTemp) ? 0.7 : Math.min(Math.max(rawTemp, 0), 1.5);

    const tenant = await this.agentService.getConfig(tenantId);

    const configWithTenant = {
      ...body.config,
      id: tenantId,
      name: (tenant as any)?.name,
      aiName: body.config?.aiName?.trim() || tenant?.aiName || 'Sofia',
      aiTemperature: safeTemp,
    };
    const result = await this.aiService.processConversation(body.messages, configWithTenant);
    return result;
  }
}

