import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitNewMessage(tenantId: string, messageData: any): void;
    emitHandoff(tenantId: string, dealData: any): void;
    emitConversationUpdated(tenantId: string, conversationData: any): void;
}
