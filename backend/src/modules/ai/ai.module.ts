import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiProcessor } from '../queues/processors/ai.processor';
import { DatabaseModule } from '../../shared/database/database.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [ConfigModule, DatabaseModule, MessagingModule],
  providers: [AiService, AiProcessor],
  exports: [AiService],
})
export class AiModule {}
