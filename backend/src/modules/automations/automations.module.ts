import { Module } from '@nestjs/common';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingModule } from '../messaging/messaging.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    MessagingModule,
    BullModule.registerQueue({ name: 'automations' })
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService, PrismaService],
  exports: [AutomationsService]
})
export class AutomationsModule {}
