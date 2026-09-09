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
    
    // O cliente avisa qual Tenant ele pertence, para entrar na sala certa
    client.on('joinTenant', (tenantId: string) => {
      client.join(tenantId);
      this.logger.log(`Cliente ${client.id} entrou na sala do Tenant: ${tenantId}`);
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

  public emitHandoff(tenantId: string, dealData: any) {
    if (this.server) {
      this.server.to(tenantId).emit('dealUpdated', dealData);
    } else {
      this.logger.warn('WebSocket server not initialized yet, skipping emitHandoff');
    }
  }
}
