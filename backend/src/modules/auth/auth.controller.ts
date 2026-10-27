import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password, body.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-tenant')
  async switchTenant(@Req() req: any, @Body('tenantId') tenantId: string) {
    const userId = req.user?.id || req.user?.sub;
    return this.authService.switchTenant(userId, tenantId);
  }
}
