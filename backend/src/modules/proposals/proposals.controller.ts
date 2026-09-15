import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { UpdateProposalStatusDto } from './dto/update-proposal-status.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.proposalsService.findAll(tenantId, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposalsService.create(tenantId, dto);
  }

  @Get('company-profile')
  @UseGuards(JwtAuthGuard)
  async getCompanyProfile(@CurrentTenant() tenantId: string) {
    return this.proposalsService.getCompanyProfile(tenantId);
  }

  @Patch('company-profile')
  @UseGuards(JwtAuthGuard)
  async updateCompanyProfile(
    @CurrentTenant() tenantId: string,
    @Body() body: { name?: string; cnpj?: string; logoUrl?: string; phone?: string; address?: string; email?: string },
  ) {
    return this.proposalsService.updateCompanyProfile(tenantId, body);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(tenantId, id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async patch(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
  ) {
    return this.proposalsService.updateStatus(tenantId, id, dto);
  }

  @Get(':id/whatsapp-share')
  @UseGuards(JwtAuthGuard)
  async getWhatsAppShare(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.getWhatsAppShare(tenantId, id);
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
  @UseGuards(JwtAuthGuard)
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.delete(tenantId, id);
  }
}

