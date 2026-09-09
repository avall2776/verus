import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CrmService } from './crm.service';
import { CrmController } from './crm.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [CrmService],
  controllers: [CrmController],
})
export class CrmModule {}
