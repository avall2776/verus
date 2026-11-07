import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { AuthService } from './auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { SessionService } from './services/session.service';
import { EmailsModule } from '../emails/emails.module';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-change-me',
      signOptions: { expiresIn: '7d' },
    }),
    EmailsModule,
  ],
  controllers: [AuthController, UsersController],
  providers: [
    JwtStrategy,
    AuthService,
    TwoFactorService,
    SessionService,
  ],
  exports: [JwtStrategy, PassportModule, AuthService, SessionService, TwoFactorService],
})
export class AuthModule {}
