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
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.contractsService.findAll(tenantId, search, status);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(tenantId, dto);
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
  @UseGuards(JwtAuthGuard)
  async getWhatsAppShare(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.getWhatsAppShare(tenantId, id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async delete(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.delete(tenantId, id);
  }
}

