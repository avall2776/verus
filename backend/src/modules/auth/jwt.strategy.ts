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
    const { sub: userId, tenantId, role } = payload;
    const isSuperAdmin = Boolean(payload.isSuperAdmin || role === 'SUPER_ADMIN');

    if (!userId) {
      throw new UnauthorizedException('Token inválido.');
    }

    return { 
      id: userId, 
      userId, 
      tenantId: tenantId || null, 
      role: role || 'AGENT', 
      isSuperAdmin 
    };
  }
}
