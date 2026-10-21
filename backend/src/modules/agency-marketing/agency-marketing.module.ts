import { Module } from '@nestjs/common';
import { AgencyMarketingController } from './agency-marketing.controller';
import { AgencyMarketingService } from './agency-marketing.service';
import { GoogleDriveSyncService } from './google-drive-sync.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { MarketingModuleGuard } from '../../shared/guards/marketing-module.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AgencyMarketingController],
  providers: [AgencyMarketingService, GoogleDriveSyncService, MarketingModuleGuard],
  exports: [AgencyMarketingService, GoogleDriveSyncService, MarketingModuleGuard],
})
export class AgencyMarketingModule {}
