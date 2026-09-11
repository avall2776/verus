import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  async create(@Request() req, @Body() body: { name: string, color?: string }) {
    return this.departmentsService.create(req.user.tenantId, body.name, body.color || '#cccccc');
  }

  @Get()
  async findAll(@Request() req) {
    return this.departmentsService.findAll(req.user.tenantId);
  }

  @Post(':id/users')
  async addUser(@Request() req, @Param('id') id: string, @Body() body: { userId: string }) {
    return this.departmentsService.addUserToDepartment(req.user.tenantId, id, body.userId);
  }

  @Delete(':id/users/:userId')
  async removeUser(@Request() req, @Param('id') id: string, @Param('userId') userId: string) {
    return this.departmentsService.removeUserFromDepartment(req.user.tenantId, id, userId);
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: { name?: string, color?: string }) {
    return this.departmentsService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    return this.departmentsService.delete(req.user.tenantId, id);
  }
}
