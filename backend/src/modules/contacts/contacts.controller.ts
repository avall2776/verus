import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async listContacts(@CurrentTenant() tenantId: string) {
    return this.contactsService.findAll(tenantId);
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
