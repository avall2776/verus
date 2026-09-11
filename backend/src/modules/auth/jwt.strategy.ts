import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-me',
    });
  }

  async validate(payload: any) {
    const { sub: userId, tenantId, role } = payload;
    
    if (!userId || !tenantId) {
      throw new UnauthorizedException('Token inválido ou sem contexto de Tenant.');
    }

    return { id: userId, userId, tenantId, role: role || 'AGENT' };
  }
}
