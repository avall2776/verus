import { Controller, Get, Post, Delete, Patch, Put, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
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

  @Post()
  async create(
    @Request() req,
    @Body() body: { name: string; email: string; password?: string; role?: string }
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant não identificado.');

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    if (!name || !email) {
      throw new BadRequestException('Nome e e-mail são obrigatórios.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Este e-mail já está cadastrado no sistema.');
    }

    const rawPass = body.password?.trim() || 'Versus@123';
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(rawPass, 10);

    const role = (body.role || 'AGENT').toUpperCase();

    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'AGENT',
        tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isOnline: true,
      }
    });

    return {
      message: 'Usuário cadastrado com sucesso!',
      user: newUser,
    };
  }

  @Delete(':id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    const currentUserId = req.user?.id || req.user?.userId;

    if (id === currentUserId) {
      throw new BadRequestException('Você não pode excluir o seu próprio usuário.');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!targetUser) {
      throw new BadRequestException('Usuário não encontrado na sua empresa.');
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      message: `Usuário '${targetUser.name}' excluído com sucesso.`,
    };
  }
}

