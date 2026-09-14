import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Request() req) {
    return this.prisma.user.findMany({
      where: { tenantId: req.user.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isOnline: true
      }
    });
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() body: { name: string }) {
    return this.prisma.user.update({
      where: { id: req.user.id },
      data: { name: body.name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true
      }
    });
  }

  @Patch(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: { name: string }) {
    return this.prisma.user.update({
      where: { id: id },
      data: { name: body.name },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true
      }
    });
  }
}
