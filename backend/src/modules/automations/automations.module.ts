import { Module } from '@nestjs/common';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingModule } from '../messaging/messaging.module';
import { BullModule } from '@nestjs/bullmq';
import { AutomationsProcessor } from './automations.processor';

@Module({
  imports: [
    MessagingModule,
    BullModule.registerQueue({ name: 'automations' })
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService, PrismaService, AutomationsProcessor],
  exports: [AutomationsService]
})
export class AutomationsModule {}
