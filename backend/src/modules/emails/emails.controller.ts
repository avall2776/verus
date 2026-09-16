import { 
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards 
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto } from './dto/send-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('emails')
@UseGuards(JwtAuthGuard)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  async listEmails(
    @CurrentTenant() tenantId: string,
    @Query('folder') folder?: string,
    @Query('search') search?: string,
    @Query('isStarred') isStarred?: string,
    @Query('isRead') isRead?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.emailsService.listEmails(tenantId, {
      folder,
      search,
      isStarred,
      isRead,
      page,
      limit,
    });
  }

  @Get('counts')
  async getCounts(@CurrentTenant() tenantId: string) {
    return this.emailsService.getCounts(tenantId);
  }

  @Get(':id')
  async getEmailById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.emailsService.getEmailById(tenantId, id);
  }

  @Post('send')
  async sendEmail(
    @CurrentTenant() tenantId: string,
    @Body() dto: SendEmailDto,
  ) {
    return this.emailsService.sendEmail(tenantId, dto);
  }

  @Patch(':id/star')
  async toggleStar(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.emailsService.toggleStar(tenantId, id);
  }

  @Patch(':id/folder')
  async moveToFolder(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('folder') folder: string,
  ) {
    return this.emailsService.moveToFolder(tenantId, id, folder);
  }

  @Patch(':id')
  async updateEmail(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmailDto,
  ) {
    return this.emailsService.updateEmail(tenantId, id, dto);
  }

  @Delete(':id')
  async deleteEmail(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.emailsService.deleteEmail(tenantId, id);
  }
}
