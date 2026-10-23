import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { RadarStoriesController } from './controllers/radar-stories.controller';
import { RadarStoriesService } from './services/radar-stories.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsModule } from '../automations/automations.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AutomationsModule, AiModule],
  controllers: [CrmController, RadarStoriesController],
  providers: [CrmService, RadarStoriesService, PrismaService],
  exports: [CrmService, RadarStoriesService],
})
export class CrmModule {}
