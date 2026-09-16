import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
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

  @Get('summary')
  async getSummary(
    @CurrentTenant() tenantId: string,
    @Query('channel') channel?: string,
  ) {
    return this.goalsService.getSummary(tenantId, channel);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateGoalDto,
  ) {
    return this.goalsService.create(tenantId, dto);
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.goalsService.delete(tenantId, id);
  }

  @Get('leaderboard')
  async getLeaderboard(@CurrentTenant() tenantId: string) {
    return this.goalsService.getLeaderboard(tenantId);
  }

  @Get('leaderboard/:userId/details')
  async getSellerDetails(
    @CurrentTenant() tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.goalsService.getSellerDetails(tenantId, userId);
  }
}

