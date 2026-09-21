import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, colocar a URL exata do painel Front-end
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente Web conectado no rádio: ${client.id}`);
    
    // O cliente avisa a qual Tenant pertence para entrar na sala certa
    client.on('joinTenant', (tenantId: string) => {
      if (!tenantId) return;
      // Remove o socket de salas anteriores de tenant para evitar vazamento de notificações
      Array.from(client.rooms).forEach(room => {
        if (room !== client.id) {
          client.leave(room);
        }
      });
      client.join(tenantId);
      this.logger.log(`Cliente ${client.id} entrou na sala: ${tenantId}`);
    });

    client.on('leaveTenant', (tenantId?: string) => {
      if (tenantId) {
        client.leave(tenantId);
      } else {
        Array.from(client.rooms).forEach(room => {
          if (room !== client.id) client.leave(room);
        });
      }
      this.logger.log(`Cliente ${client.id} isolado das salas de tenant.`);
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  public emitNewMessage(tenantId: string, messageData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('newMessage', messageData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitNewMessage');
    }
  }

  public emitMessageDeleted(tenantId: string, payload: { conversationId: string; messageId: string }) {
    if (this.server) {
      this.server.to(tenantId).emit('messageDeleted', payload);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitMessageDeleted');
    }
  }

  public emitHandoff(tenantId: string, dealData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('dealUpdated', dealData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitHandoff');
    }
  }

  public emitConversationUpdated(tenantId: string, conversationData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('conversationUpdated', conversationData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitConversationUpdated');
    }
  }

  public emitConversationTransferred(tenantId: string, transferData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('conversationTransferred', transferData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitConversationTransferred');
    }
  }

  public emitTicketUpdate(tenantId: string, ticketData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('ticketUpdated', ticketData);
      this.server.emit('adminTicketUpdated', ticketData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitTicketUpdate');
    }
  }

  public emitNewTeamMessage(tenantId: string, messageData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('newTeamMessage', messageData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitNewTeamMessage');
    }
  }

  public emitTeamMessageDeleted(tenantId: string, payload: { messageId: string; channelId?: string | null; senderId?: string; receiverId?: string | null }) {
    if (this.server) {
      this.server.to(tenantId).emit('teamMessageDeleted', payload);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitTeamMessageDeleted');
    }
  }

  public emitTeamHistoryCleared(tenantId: string, payload: { channelId?: string; user1Id?: string; user2Id?: string }) {
    if (this.server) {
      this.server.to(tenantId).emit('teamHistoryCleared', payload);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitTeamHistoryCleared');
    }
  }

  public emitTeamChannelDeleted(tenantId: string, channelId: string) {
    if (this.server) {
      this.server.to(tenantId).emit('teamChannelDeleted', { channelId });
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitTeamChannelDeleted');
    }
  }

  public emitWhatsAppStatusUpdated(tenantId: string, instanceData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('whatsappStatusUpdated', instanceData);
      this.server.to(tenantId).emit('instanceUpdated', instanceData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitWhatsAppStatusUpdated');
    }
  }

  public emitMessageStatusUpdated(tenantId: string, statusData: { messageId?: string; providerMessageId?: string; status: string; conversationId?: string }) {
    if (this.server) {
      this.server.to(tenantId).emit('messageStatusUpdated', statusData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitMessageStatusUpdated');
    }
  }

  public emitContactUpdated(tenantId: string, contactData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('contactUpdated', contactData);
      this.server.to(tenantId).emit('conversationUpdated', { contactId: contactData.id, contact: contactData });
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitContactUpdated');
    }
  }
}

