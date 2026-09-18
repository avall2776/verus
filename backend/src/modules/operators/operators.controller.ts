import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../shared/guards/super-admin.guard';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  private checkSuperAdmin(req: any) {
    const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
    if (!isSuperAdmin) {
      throw new ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
    }
  }

  @Get()
  async findAll(@Request() req) {
    this.checkSuperAdmin(req);
    return this.operatorsService.findAllWithMetrics();
  }

  @Get(':id/live-chats')
  async getLiveChats(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.operatorsService.getLiveChatsForOperator(id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateOperatorDto) {
    this.checkSuperAdmin(req);
    const inviterName = req.user?.name || 'Super Admin VERSUS';
    return this.operatorsService.createOperator(dto, inviterName);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateOperatorDto,
  ) {
    this.checkSuperAdmin(req);
    return this.operatorsService.updateOperator(id, dto);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    this.checkSuperAdmin(req);
    return this.operatorsService.deleteOperator(id);
  }
}
