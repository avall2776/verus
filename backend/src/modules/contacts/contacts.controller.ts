import { Controller, Get, Post, Patch, Param, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get('export/vcf')
  async exportVcf(@CurrentTenant() tenantId: string, @Res() res: Response) {
    const vcfContent = await this.contactsService.generateVcf(tenantId);
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="contatos_verto_agenda.vcf"');
    return res.send(vcfContent);
  }

  @Get()
  async listContacts(@CurrentTenant() tenantId: string) {
    return this.contactsService.findAll(tenantId);
  }

  @Post()
  async createContact(
    @CurrentTenant() tenantId: string,
    @Body() data: { name: string; phone?: string; email?: string; source?: string; tags?: string[] },
  ) {
    return this.contactsService.createContact(tenantId, data);
  }

  @Patch(':id')
  async updateContact(
    @CurrentTenant() tenantId: string,
    @Param('id') contactId: string,
    @Body() data: { name?: string; phone?: string; email?: string }
  ) {
    return this.contactsService.updateContact(tenantId, contactId, data);
  }

  @Patch(':id/tags')
  async updateTags(
    @CurrentTenant() tenantId: string,
    @Param('id') contactId: string,
    @Body('tags') tags: string[]
  ) {
    return this.contactsService.updateTags(tenantId, contactId, tags);
  }
}
