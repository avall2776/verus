import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../shared/database/database.module';
import { SupportService } from './support.service';
import { SupportAiService } from './support-ai.service';
import { SupportController } from './support.controller';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [SupportController],
  providers: [SupportService, SupportAiService],
  exports: [SupportService, SupportAiService],
})
export class SupportModule {}
