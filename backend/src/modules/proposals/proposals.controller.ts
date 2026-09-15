import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.proposalsService.findAll(tenantId, status);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposalsService.create(tenantId, dto);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
  ) {
    return this.proposalsService.updateStatus(tenantId, id, dto);
  }

  @Get(':id/pdf')
  async getPdf(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const html = await this.proposalsService.generatePdfHtml(tenantId, id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}
