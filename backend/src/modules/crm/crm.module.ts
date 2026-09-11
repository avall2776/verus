import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsModule } from '../automations/automations.module';

@Module({
  imports: [AutomationsModule],
  controllers: [CrmController],
  providers: [CrmService, PrismaService],
  exports: [CrmService],
})
export class CrmModule {}
