import { Controller, Get, Patch, Put, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
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
        avatarUrl: true,
        isOnline: true
      }
    });
  }

  @Patch('profile')
  @Put('profile')
  async updateProfile(@Request() req, @Body() body: { name?: string; avatarUrl?: string }) {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new BadRequestException('ID de usuário não identificado no token.');
    }
    
    const updateData: any = {};
    if (body.name !== undefined) {
      const name = body.name?.trim();
      if (!name) {
        throw new BadRequestException('Nome do usuário é obrigatório.');
      }
      updateData.name = name;
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        tenantId: true
      }
    });
  }

  @Patch(':id')
  @Put(':id')
  async update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; avatarUrl?: string }) {
    const updateData: any = {};
    if (body.name !== undefined) {
      const name = body.name?.trim();
      if (!name) {
        throw new BadRequestException('Nome do usuário é obrigatório.');
      }
      updateData.name = name;
    }
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl;
    }

    return this.prisma.user.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        tenantId: true
      }
    });
  }
}

