import { 
  Controller, Get, Post, Patch, Body, Param, Query, 
  UseGuards, Request, BadRequestException 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';

@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  async findAll(@Request() req, @Query() query: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    myOnly?: string;
    tenantId?: string;
  }) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    const tenantId = req.user.tenantId;
    const userId = query.myOnly === 'true' ? (req.user.id || req.user.userId) : undefined;
    return this.supportService.findAll(tenantId, {
      status: query.status,
      priority: query.priority,
      category: query.category,
      search: query.search,
      userId,
      isSuperAdmin,
      targetTenantId: query.tenantId
    });
  }

  @Get('notices')
  async getNotices(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.supportService.getNotices(tenantId);
  }

  @Get('tickets/:id')
  async findOne(@Request() req, @Param('id') id: string) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    const tenantId = req.user.tenantId;
    return this.supportService.findOne(id, tenantId, isSuperAdmin);
  }

  @Post('tickets')
  async create(@Request() req, @Body() dto: CreateTicketDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.supportService.create(tenantId, userId, dto);
  }

  @Post('tickets/:id/messages')
  async addMessage(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateTicketMessageDto
  ) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.supportService.addMessage(id, tenantId, userId, dto, isSuperAdmin);
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    const tenantId = req.user.tenantId;
    if (!body?.status) {
      throw new BadRequestException('Status é obrigatório.');
    }
    return this.supportService.updateStatus(id, tenantId, body.status, isSuperAdmin);
  }

  @Patch('tickets/:id/assign')
  async assign(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { assignedToId: string | null }
  ) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    const tenantId = req.user.tenantId;
    return this.supportService.assign(id, tenantId, body?.assignedToId ?? null, isSuperAdmin);
  }
}
