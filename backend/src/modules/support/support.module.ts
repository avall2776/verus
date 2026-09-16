import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
