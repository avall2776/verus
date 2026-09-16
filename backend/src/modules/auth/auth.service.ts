import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: { select: { id: true, name: true, isActive: true } } }
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN');

    if (!isSuperAdmin && user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException('O acesso desta empresa está suspenso temporariamente pela administração.');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload = { 
      sub: user.id, 
      tenantId: user.tenantId, 
      role: user.role,
      isSuperAdmin 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isSuperAdmin,
        avatarUrl: user.avatarUrl,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name
      }
    };
  }
}
