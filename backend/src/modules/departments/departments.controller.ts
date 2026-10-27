import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  async create(@CurrentTenant() tenantId: string, @Body() body: { name: string, color?: string }) {
    return this.departmentsService.create(tenantId, body.name, body.color || '#cccccc');
  }

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.departmentsService.findAll(tenantId);
  }

  @Post(':id/users')
  async addUser(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { userId: string }) {
    return this.departmentsService.addUserToDepartment(tenantId, id, body.userId);
  }

  @Delete(':id/users/:userId')
  async removeUser(@CurrentTenant() tenantId: string, @Param('id') id: string, @Param('userId') userId: string) {
    return this.departmentsService.removeUserFromDepartment(tenantId, id, userId);
  }

  @Patch(':id')
  async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { name?: string, color?: string }) {
    return this.departmentsService.update(tenantId, id, body);
  }

  @Delete(':id')
  async delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.departmentsService.delete(tenantId, id);
  }
}

