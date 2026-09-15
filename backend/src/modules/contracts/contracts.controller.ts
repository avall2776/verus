import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.contractsService.findAll(tenantId);
  }

  @Post()
  async create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(tenantId, dto);
  }

  @Get(':id')
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContractStatusDto,
  ) {
    return this.contractsService.updateStatus(tenantId, id, dto);
  }
}
