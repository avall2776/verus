import { Controller, Post, Get, Body, Query, UseGuards, Req, Optional } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionService } from './services/session.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../shared/guards/super-admin.guard';
import { extractFullTelemetry } from './utils/client-telemetry.util';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    @Optional() private readonly chatGateway?: ChatGateway,
  ) {}

  @Post('login')
  async login(@Req() req: any, @Body() body: any) {
    const telemetry = await extractFullTelemetry(req);
    return this.authService.login(
      body.email,
      body.password,
      body.tenantId,
      telemetry,
      body.trustedDeviceToken,
    );
  }

  @Post('verify-2fa')
  async verify2FA(@Req() req: any, @Body() body: any) {
    const telemetry = await extractFullTelemetry(req);
    return this.authService.verify2FALogin(
      body.tempToken,
      body.code,
      Boolean(body.rememberDevice),
      telemetry,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-tenant')
  async switchTenant(@Req() req: any, @Body('tenantId') tenantId: string) {
    const userId = req.user?.id || req.user?.sub;
    const telemetry = await extractFullTelemetry(req);
    return this.authService.switchTenant(userId, tenantId, telemetry);
  }

  // ==========================================
  // SUPERADMIN MASTER: SOC & AUDITORIA DE SESSÕES
  // ==========================================

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get('admin/sessions')
  async getActiveSessions(@Query('tenantId') tenantId?: string) {
    return this.sessionService.listActiveSessions(tenantId);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get('admin/audit-logs')
  async getAuditLogs(@Query('tenantId') tenantId?: string) {
    return this.sessionService.listAuditLogs(tenantId);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('admin/kill-session')
  async killSession(@Body('sessionId') sessionId: string) {
    const result = await this.sessionService.killSession(sessionId);
    
    // Emite encerramento forçado via WebSocket
    try {
      if (this.chatGateway?.server) {
        this.chatGateway.server.emit('session_terminated', {
          sessionId,
          userId: result.userId,
          reason: 'Sessão encerrada remotamente pela administração.',
        });
      }
    } catch (e) {}

    return result;
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('admin/kill-all-sessions')
  async killAllSessions(
    @Req() req: any,
    @Body('preserveCurrent') preserveCurrent: boolean = true,
  ) {
    const rawToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '') || req.query?.token;
    const result = await this.sessionService.killAllSessions(preserveCurrent ? rawToken : undefined);

    // Emite encerramento forçado via WebSocket para todos os navegadores conectados
    try {
      if (this.chatGateway?.server) {
        this.chatGateway.server.emit('session_terminated', {
          all: true,
          exceptToken: preserveCurrent ? rawToken : undefined,
          reason: 'Todas as conexões foram encerradas por auditoria global de segurança.',
        });
      }
    } catch (e) {}

    return result;
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post('admin/unlock-user')
  async unlockUser(@Body('userId') userId: string) {
    return this.sessionService.unlockUser(userId);
  }
}
