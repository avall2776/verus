import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { ChatModule } from '../chat/chat.module';
import { AutomationsModule } from '../automations/automations.module';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { ApiTokensController } from './api-tokens.controller';
import { ApiTokensService } from './api-tokens.service';
import { PublicApiKeyGuard } from './guards/public-api-key.guard';

@Module({
  imports: [
    DatabaseModule,
    ChatModule,
    AutomationsModule,
  ],
  controllers: [
    PublicApiController,
    ApiTokensController,
  ],
  providers: [
    PublicApiService,
    ApiTokensService,
    PublicApiKeyGuard,
  ],
  exports: [
    PublicApiService,
    ApiTokensService,
    PublicApiKeyGuard,
  ],
})
export class PublicApiModule {}
