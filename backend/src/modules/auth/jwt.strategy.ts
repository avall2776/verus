import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-me',
    });
  }

  async validate(payload: any) {
    const userId = payload?.sub || payload?.id || payload?.userId;
    const role = String(payload?.role || 'AGENT').toUpperCase();
    const isSuperAdmin = Boolean(
      payload?.isSuperAdmin === true ||
      payload?.isSuperAdmin === 'true' ||
      role === 'SUPER_ADMIN' ||
      role === 'SUPERADMIN'
    );

    if (!userId) {
      throw new UnauthorizedException('Token inválido: identificador de usuário ausente.');
    }

    return { 
      id: userId, 
      userId, 
      tenantId: payload.tenantId || null, 
      role, 
      isSuperAdmin 
    };
  }
}
