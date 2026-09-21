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
import { SuperAdminGuard } from '../../shared/guards/super-admin.guard';
import { TenantsService } from './tenants.service';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

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

  @UseGuards(SuperAdminGuard)
  @Get('stats/overview')
  async getStats(@Request() req) {
    return this.tenantsService.getStats();
  }

  @Get('me')
  async getMyTenant(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getMyTenant(tenantId);
  }

  @Patch('me')
  async updateMyTenant(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.tenantsService.updateMyTenant(tenantId, body);
  }

  @UseGuards(SuperAdminGuard)
  @Get()
  async findAll(@Request() req, @Query() query: QueryTenantsDto) {
    return this.tenantsService.findAll(query);
  }

  @UseGuards(SuperAdminGuard)
  @Post()
  async create(@Request() req, @Body() body: CreateTenantDto) {
    return this.tenantsService.create(body);
  }

  @UseGuards(SuperAdminGuard)
  @Get('plans/list')
  async getPlans(@Request() req) {
    return this.tenantsService.getPlans();
  }

  @UseGuards(SuperAdminGuard)
  @Post('plans')
  async createPlan(@Request() req, @Body() body: CreatePlanDto) {
    return this.tenantsService.createPlan(body);
  }

  @UseGuards(SuperAdminGuard)
  @Patch('plans/:id')
  async updatePlan(
    @Request() req,
    @Param('id') id: string,
    @Body() body: Partial<CreatePlanDto>,
  ) {
    return this.tenantsService.updatePlan(id, body);
  }

  @UseGuards(SuperAdminGuard)
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto
  ) {
    return this.tenantsService.update(id, body);
  }

  @UseGuards(SuperAdminGuard)
  @Put(':id')
  async updatePut(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantDto
  ) {
    return this.tenantsService.update(id, body);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: UpdateTenantStatusDto
  ) {
    return this.tenantsService.updateStatus(id, body.isActive);
  }

  @UseGuards(SuperAdminGuard)
  @Post(':id/reset-admin-password')
  async resetAdminPassword(
    @Request() req,
    @Param('id') id: string,
    @Body() body: ResetAdminPasswordDto
  ) {
    return this.tenantsService.resetAdminPassword(id, body?.newPassword);
  }

  @UseGuards(SuperAdminGuard)
  @Patch(':tenantId/users/:userId')
  async updateTenantUser(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: { name?: string; email?: string; role?: string; isActive?: boolean }
  ) {
    return this.tenantsService.updateTenantUser(tenantId, userId, body);
  }

  @UseGuards(SuperAdminGuard)
  @Post(':tenantId/users/:userId/reset-password')
  async resetTenantUserPassword(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() body: { newPassword?: string; sendEmail?: boolean }
  ) {
    return this.tenantsService.resetTenantUserPassword(tenantId, userId, body);
  }

  @UseGuards(SuperAdminGuard)
  @Delete(':tenantId/users/:userId')
  async deleteTenantUser(
    @Request() req,
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string
  ) {
    return this.tenantsService.deleteTenantUser(tenantId, userId);
  }
}

