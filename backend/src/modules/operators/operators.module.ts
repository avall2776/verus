import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { EmailsModule } from '../emails/emails.module';
import { OperatorsController } from './operators.controller';
import { OperatorsService } from './operators.service';

@Module({
  imports: [DatabaseModule, EmailsModule],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
