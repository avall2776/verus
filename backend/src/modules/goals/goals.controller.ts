import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.goalsService.findAll(tenantId);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateGoalDto,
  ) {
    return this.goalsService.create(tenantId, dto);
  }

  @Get('leaderboard')
  async getLeaderboard(@CurrentTenant() tenantId: string) {
    return this.goalsService.getLeaderboard(tenantId);
  }
}
