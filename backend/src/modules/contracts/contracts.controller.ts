import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../shared/guards/plan.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.contractsService.findAll(tenantId, search, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(tenantId, dto);
  }

  @Get('public/:codeOrId')
  async getPublic(@Param('codeOrId') codeOrId: string) {
    return this.contractsService.findPublicByCodeOrId(codeOrId);
  }

  @Post('public/:codeOrId/sign')
  async signPublic(
    @Param('codeOrId') codeOrId: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    return this.contractsService.signPublic(codeOrId, body || {}, clientIp, userAgent);
  }

  @Get(':id/pdf')
  async getPdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('tenantId') queryTenantId?: string,
  ) {
    const html = await this.contractsService.generatePdfHtml(id, queryTenantId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
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
    return this.contractsService.getWhatsAppShare(tenantId, id, origin);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
    @Req() req: Request,
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    return this.contractsService.updateStatus(tenantId, id, dto, clientIp, userAgent);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequireModule('proposalsContracts')
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.delete(tenantId, id);
  }
}
