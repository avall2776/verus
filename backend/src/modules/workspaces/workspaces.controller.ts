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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async list(@Request() req) {
    const tenantId = req.user?.tenantId;
    return this.workspacesService.list(tenantId);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateWorkspaceDto) {
    const tenantId = req.user?.tenantId;
    return this.workspacesService.create(tenantId, dto);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto
  ) {
    const tenantId = req.user?.tenantId;
    return this.workspacesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async delete(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    return this.workspacesService.delete(tenantId, id);
  }
}
