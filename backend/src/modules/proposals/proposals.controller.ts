import { Controller, Get, Post, Patch, Put, Delete, Param, Body, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
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

  @Get('company-profile')
  async getCompanyProfile(@CurrentTenant() tenantId: string) {
    return this.proposalsService.getCompanyProfile(tenantId);
  }

  @Patch('company-profile')
  async updateCompanyProfile(
    @CurrentTenant() tenantId: string,
    @Body() body: { name?: string; cnpj?: string; logoUrl?: string; phone?: string; address?: string; email?: string },
  ) {
    return this.proposalsService.updateCompanyProfile(tenantId, body);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.findOne(tenantId, id);
  }

  @Put(':id')
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(tenantId, id, dto);
  }

  @Patch(':id')
  async patch(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
  ) {
    return this.proposalsService.updateStatus(tenantId, id, dto);
  }

  @Get(':id/whatsapp-share')
  async getWhatsAppShare(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.getWhatsAppShare(tenantId, id);
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

  @Delete(':id')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.proposalsService.delete(tenantId, id);
  }
}

