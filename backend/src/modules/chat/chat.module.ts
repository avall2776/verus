import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { MessagingModule } from '../messaging/messaging.module';
import { AuthModule } from '../auth/auth.module';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';

@Global()
@Module({
  imports: [DatabaseModule, MessagingModule, AuthModule],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
  exports: [ChatGateway],
})
export class ChatModule {}
