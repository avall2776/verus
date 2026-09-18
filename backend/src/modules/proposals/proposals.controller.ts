import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../shared/guards/plan.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.proposalsService.findAll(tenantId, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposalsService.create(tenantId, dto);
  }

  @Get('company-profile')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async getCompanyProfile(@CurrentTenant() tenantId: string) {
    return this.proposalsService.getCompanyProfile(tenantId);
  }

  @Patch('company-profile')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async updateCompanyProfile(
    @CurrentTenant() tenantId: string,
    @Body() body: { name?: string; cnpj?: string; logoUrl?: string; phone?: string; address?: string; email?: string },
  ) {
    return this.proposalsService.updateCompanyProfile(tenantId, body);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(tenantId, id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async patch(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
  ) {
    return this.proposalsService.updateStatus(tenantId, id, dto);
  }

  @Get('public/:codeOrId')
  async getPublic(@Param('codeOrId') codeOrId: string) {
    return this.proposalsService.findPublicByCodeOrId(codeOrId);
  }

  @Post('public/:codeOrId/accept')
  async acceptPublic(@Param('codeOrId') codeOrId: string) {
    return this.proposalsService.acceptPublic(codeOrId);
  }

  @Get(':id/whatsapp-share')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async getWhatsAppShare(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('origin') queryOrigin?: string,
    @Req() req?: Request,
  ) {
    const origin = queryOrigin || (req?.headers?.origin as string) || (req?.headers?.referer ? new URL(req.headers.referer as string).origin : undefined);
    return this.proposalsService.getWhatsAppShare(tenantId, id, origin);
  }

  @Get(':id/pdf')
  async getPdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const html = await this.proposalsService.generatePdfHtml(id, queryTenantId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.delete(tenantId, id);
  }
}
