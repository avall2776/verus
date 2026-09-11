import { Module } from '@nestjs/common';
import { TeamChatController } from './team-chat.controller';
import { TeamChatService } from './team-chat.service';
import { ChatModule } from '../chat/chat.module'; // para usar o ChatGateway

@Module({
  imports: [ChatModule],
  controllers: [TeamChatController],
  providers: [TeamChatService],
})
export class TeamChatModule {}
