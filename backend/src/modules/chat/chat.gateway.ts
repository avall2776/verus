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

  // Mapeamento em memória para Presença Online de Usuários da Equipe:
  // tenantId -> Map<userId, Set<socketId>>
  private onlineUsersByTenant: Map<string, Map<string, Set<string>>> = new Map();
  // socketId -> { tenantId?: string, userId?: string }
  private socketInfo: Map<string, { tenantId?: string; userId?: string }> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Cliente Web conectado no rádio: ${client.id}`);

    // Registro de presença do usuário autenticado no sistema
    client.on('userPresence', (data: { tenantId?: string; userId?: string }) => {
      if (!data || !data.tenantId || !data.userId) return;
      const { tenantId, userId } = data;

      const existing = this.socketInfo.get(client.id) || {};
      this.socketInfo.set(client.id, { ...existing, tenantId, userId });

      if (!this.onlineUsersByTenant.has(tenantId)) {
        this.onlineUsersByTenant.set(tenantId, new Map());
      }
      const tenantUsers = this.onlineUsersByTenant.get(tenantId)!;
      if (!tenantUsers.has(userId)) {
        tenantUsers.set(userId, new Set());
      }
      const sockets = tenantUsers.get(userId)!;
      const wasOnline = sockets.size > 0;
      sockets.add(client.id);

      if (!wasOnline && this.server) {
        this.server.to(tenantId).emit('userPresenceChanged', { userId, isOnline: true });
        this.logger.log(`[Presença] Usuário ${userId} está ONLINE no tenant ${tenantId}`);
      }
    });
    
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

      const existing = this.socketInfo.get(client.id) || {};
      this.socketInfo.set(client.id, { ...existing, tenantId });
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
    const info = this.socketInfo.get(client.id);
    if (info && info.tenantId && info.userId) {
      const tenantUsers = this.onlineUsersByTenant.get(info.tenantId);
      if (tenantUsers && tenantUsers.has(info.userId)) {
        const sockets = tenantUsers.get(info.userId)!;
        sockets.delete(client.id);
        if (sockets.size === 0) {
          tenantUsers.delete(info.userId);
          if (this.server) {
            this.server.to(info.tenantId).emit('userPresenceChanged', { userId: info.userId, isOnline: false });
            this.logger.log(`[Presença] Usuário ${info.userId} está OFFLINE no tenant ${info.tenantId}`);
          }
        }
      }
    }
    this.socketInfo.delete(client.id);
  }

  public getOnlineUserIds(tenantId: string): Set<string> {
    const tenantUsers = this.onlineUsersByTenant.get(tenantId);
    if (!tenantUsers) return new Set();
    const active = new Set<string>();
    tenantUsers.forEach((sockets, uId) => {
      if (sockets.size > 0) active.add(uId);
    });
    return active;
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

  public emitMessageTranscribed(tenantId: string, payload: { messageId: string; conversationId: string; audioTranscription: string }) {
    if (this.server) {
      this.server.to(tenantId).emit('messageTranscribed', payload);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitMessageTranscribed');
    }
  }

  public emitConversationDeleted(tenantId: string, payload: { conversationId: string }) {
    if (this.server) {
      this.server.to(tenantId).emit('conversationDeleted', payload);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitConversationDeleted');
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

  public emitStoryViewed(tenantId: string, payload: any) {
    if (this.server) {
      this.server.to(tenantId).emit('radar:story-view', payload);
    }
  }

  public emitStoryPosted(tenantId: string, payload: any) {
    if (this.server) {
      this.server.to(tenantId).emit('radar:story-posted', payload);
    }
  }

  public emitMessageReactionUpdated(
    tenantId: string,
    payload: { messageId: string; conversationId: string; reactions: any }
  ) {
    if (this.server) {
      this.server.to(tenantId).emit('messageReactionUpdated', payload);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitMessageReactionUpdated');
    }
  }
}

