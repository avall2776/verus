import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Delete,
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

  private async checkSuperAdmin(req: any) {
    const userRole = String(req.user?.role || '').toUpperCase();
    const isSuperAdmin = Boolean(
      req.user?.isSuperAdmin || 
      userRole === 'SUPER_ADMIN' || 
      userRole === 'SUPERADMIN'
    );
    if (isSuperAdmin) {
      return true;
    }

    // Fallback de segurança contra tokens dessincronizados
    const userId = req.user?.userId || req.user?.id;
    if (userId) {
      const user = await this.tenantsService.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isSuperAdmin: true },
      });
      if (user && (user.isSuperAdmin || String(user.role).toUpperCase() === 'SUPER_ADMIN')) {
        req.user.isSuperAdmin = true;
        req.user.role = 'SUPER_ADMIN';
        return true;
      }
    }

    throw new ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
  }

  @Get('stats/overview')
  async getStats(@Request() req) {
    await this.checkSuperAdmin(req);
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
    await this.checkSuperAdmin(req);
    return this.tenantsService.findAll(query);
  }

  @Post()
  async create(@Request() req, @Body() body: CreateTenantDto) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.create(body);
  }

  @Get('plans/list')
  async getPlans(@Request() req) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.getPlans();
  }

  @Post('plans')
  async createPlan(@Request() req, @Body() body: CreatePlanDto) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.createPlan(body);
  }

  @Patch('plans/:id')
  async updatePlan(
    @Request() req,
    @Param('id') id: string,
    @Body() body: Partial<CreatePlanDto>,
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.updatePlan(id, body);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.update(id, body);
  }

  @Put(':id')
  async updatePut(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.update(id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantStatusDto
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.updateStatus(id, body.isActive);
  }

  @Post(':id/reset-admin-password')
  async resetAdminPassword(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ResetAdminPasswordDto
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.resetAdminPassword(id, body?.newPassword);
  }

  @Patch(':tenantId/users/:userId')
  async updateTenantUser(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: { name?: string; email?: string; role?: string; isActive?: boolean }
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.updateTenantUser(tenantId, userId, body);
  }

  @Post(':tenantId/users/:userId/reset-password')
  async resetTenantUserPassword(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: { newPassword?: string; sendEmail?: boolean }
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.resetTenantUserPassword(tenantId, userId, body);
  }

  @Delete(':tenantId/users/:userId')
  async deleteTenantUser(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string
  ) {
    await this.checkSuperAdmin(req);
    return this.tenantsService.deleteTenantUser(tenantId, userId);
  }
}

