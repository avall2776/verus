import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { DatabaseModule } from '../../shared/database/database.module';
import { EmailsModule } from '../emails/emails.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DatabaseModule, EmailsModule, AiModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}

