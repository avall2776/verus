import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { EngineeringService } from './engineering.service';
import { CreateEngineeringItemDto } from './dto/create-engineering-item.dto';
import { UpdateEngineeringItemDto } from './dto/update-engineering-item.dto';
import { CreateFromTicketDto } from './dto/create-from-ticket.dto';
import { ChatEngineeringDto } from './dto/chat-engineering.dto';

@UseGuards(JwtAuthGuard)
@Controller('engineering')
export class EngineeringController {
  constructor(private readonly engineeringService: EngineeringService) {}

  private checkSuperAdmin(req: any) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
    }
  }

  @Get('items')
  async getBacklog(
    @Request() req,
    @Query('stage') stage?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    this.checkSuperAdmin(req);
    return this.engineeringService.getBacklog({ stage, category, priority, search });
  }

  @Get('items/:id')
  async findById(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.findById(id);
  }

  @Post('items')
  async create(@Request() req, @Body() dto: CreateEngineeringItemDto) {
    this.checkSuperAdmin(req);
    return this.engineeringService.create(dto);
  }

  @Patch('items/:id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateEngineeringItemDto,
  ) {
    this.checkSuperAdmin(req);
    return this.engineeringService.update(id, dto);
  }

  @Delete('items/:id')
  async delete(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.delete(id);
  }

  @Post('items/from-ticket')
  async createFromTicket(@Request() req, @Body() dto: CreateFromTicketDto) {
    this.checkSuperAdmin(req);
    return this.engineeringService.createFromTicket(dto);
  }

  @Post('items/:id/analyze')
  async analyzeItem(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.analyzeItemWithAI(id);
  }

  @Get('chat/history')
  async getChatHistory(@Request() req) {
    this.checkSuperAdmin(req);
    return this.engineeringService.getChatHistory();
  }

  @Post('chat')
  async chatWithAI(@Request() req, @Body() dto: ChatEngineeringDto) {
    this.checkSuperAdmin(req);
    return this.engineeringService.chatWithEngineeringAI(dto);
  }

  @Delete('chat/history')
  async clearChatHistory(@Request() req) {
    this.checkSuperAdmin(req);
    return this.engineeringService.clearChatHistory();
  }
}
