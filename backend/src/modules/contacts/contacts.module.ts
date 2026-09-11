import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [AutomationsModule],
  controllers: [ContactsController],
  providers: [ContactsService, PrismaService],
  exports: [ContactsService]
})
export class ContactsModule {}
