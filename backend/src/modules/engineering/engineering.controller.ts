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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { EngineeringService } from './engineering.service';
import { CreateEngineeringItemDto } from './dto/create-engineering-item.dto';
import { UpdateEngineeringItemDto } from './dto/update-engineering-item.dto';
import { CreateFromTicketDto } from './dto/create-from-ticket.dto';
import { ChatEngineeringDto } from './dto/chat-engineering.dto';
import { CreateCardFromChatDto } from './dto/create-card-from-chat.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { ProductChatDto } from './dto/product-chat.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

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

  @Patch('items/:id/checklist')
  async updateChecklist(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateChecklistDto,
  ) {
    this.checkSuperAdmin(req);
    return this.engineeringService.updateChecklist(id, dto);
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

  @Post('chat/create-card')
  async createCardFromChat(@Request() req, @Body() dto: CreateCardFromChatDto) {
    this.checkSuperAdmin(req);
    return this.engineeringService.createCardFromChat(dto);
  }

  @Post('chat/transcribe-audio')
  @UseInterceptors(FileInterceptor('file'))
  async transcribeAudio(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.checkSuperAdmin(req);
    if (!file) {
      throw new BadRequestException('Arquivo de áudio não enviado.');
    }
    return this.engineeringService.transcribeAudio(file);
  }

  @Delete('chat/history')
  async clearChatHistory(@Request() req) {
    this.checkSuperAdmin(req);
    return this.engineeringService.clearChatHistory();
  }

  @Post('sync-deploy')
  async syncDeploy(@Request() req) {
    this.checkSuperAdmin(req);
    return this.engineeringService.syncDeploy();
  }

  // -------------------------------------------------------------
  // PRODUTOS E MÓDULOS EM DESENVOLVIMENTO (SANDBOX & HOMOLOGAÇÃO)
  // -------------------------------------------------------------

  @Get('products')
  async getProducts(@Request() req) {
    this.checkSuperAdmin(req);
    return this.engineeringService.getProducts();
  }

  @Get('products/:id')
  async getProductById(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.getProductById(id);
  }

  @Patch('products/:id/status')
  async updateProductStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
  ) {
    this.checkSuperAdmin(req);
    return this.engineeringService.updateProductStatus(id, dto.status);
  }

  @Post('products/:id/chat')
  async chatWithProductAI(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ProductChatDto,
  ) {
    this.checkSuperAdmin(req);
    return this.engineeringService.chatWithProductAI(id, dto);
  }

  @Get('products/:id/chat-history')
  async getProductChatHistory(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.getProductChatHistory(id);
  }

  @Post('products/:id/test')
  async runSandboxTest(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.runSandboxTest(id);
  }

  @Get('products/:id/logs')
  async getProductLogs(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.getProductLogs(id);
  }

  @Post('products/:id/clear-logs')
  async clearProductLogs(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.clearProductLogs(id);
  }

  @Post('products/:id/integrate')
  async integrateProductToProduction(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.engineeringService.integrateProductToProduction(id);
  }
}

