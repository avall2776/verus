import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
