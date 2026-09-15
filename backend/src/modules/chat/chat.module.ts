import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from '../../shared/database/database.module';
import { MessagingModule } from '../messaging/messaging.module';
import { AuthModule } from '../auth/auth.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MediaController } from './media.controller';
import { ChatGateway } from './chat.gateway';

@Global()
@Module({
  imports: [
    DatabaseModule,
    MessagingModule,
    AuthModule,
    BullModule.registerQueue({ name: 'scheduled-messages' }),
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController, MediaController],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
