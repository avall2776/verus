import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { TenantsService } from './tenants.service';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';

@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  private checkSuperAdmin(req: any) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
    }
  }

  @Get('stats/overview')
  async getStats(@Request() req) {
    this.checkSuperAdmin(req);
    return this.tenantsService.getStats();
  }

  @Get('me')
  async getMyTenant(@Request() req) {
    const tenantId = req.user?.tenantId;
    return this.tenantsService.getMyTenant(tenantId);
  }

  @Patch('me')
  async updateMyTenant(@Request() req, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    return this.tenantsService.updateMyTenant(tenantId, body);
  }

  @Get()
  async findAll(@Request() req, @Query() query: QueryTenantsDto) {
    this.checkSuperAdmin(req);
    return this.tenantsService.findAll(query);
  }

  @Post()
  async create(@Request() req, @Body() body: CreateTenantDto) {
    this.checkSuperAdmin(req);
    return this.tenantsService.create(body);
  }

  @Get('plans/list')
  async getPlans(@Request() req) {
    this.checkSuperAdmin(req);
    return this.tenantsService.getPlans();
  }

  @Post('plans')
  async createPlan(@Request() req, @Body() body: CreatePlanDto) {
    this.checkSuperAdmin(req);
    return this.tenantsService.createPlan(body);
  }

  @Patch('plans/:id')
  async updatePlan(
    @Request() req,
    @Param('id') id: string,
    @Body() body: Partial<CreatePlanDto>,
  ) {
    this.checkSuperAdmin(req);
    return this.tenantsService.updatePlan(id, body);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto
  ) {
    this.checkSuperAdmin(req);
    return this.tenantsService.update(id, body);
  }

  @Put(':id')
  async updatePut(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto
  ) {
    this.checkSuperAdmin(req);
    return this.tenantsService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantStatusDto
  ) {
    this.checkSuperAdmin(req);
    return this.tenantsService.updateStatus(id, body.isActive);
  }

  @Post(':id/reset-admin-password')
  async resetAdminPassword(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ResetAdminPasswordDto
  ) {
    this.checkSuperAdmin(req);
    return this.tenantsService.resetAdminPassword(id, body?.newPassword);
  }
}
