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
    emitConversationTransferred(tenantId: string, transferData: any): void;
    emitNewTeamMessage(tenantId: string, messageData: any): void;
    emitTeamMessageDeleted(tenantId: string, payload: {
        messageId: string;
        channelId?: string | null;
        senderId?: string;
        receiverId?: string | null;
    }): void;
    emitTeamHistoryCleared(tenantId: string, payload: {
        channelId?: string;
        user1Id?: string;
        user2Id?: string;
    }): void;
    emitTeamChannelDeleted(tenantId: string, channelId: string): void;
    emitWhatsAppStatusUpdated(tenantId: string, instanceData: any): void;
    emitMessageStatusUpdated(tenantId: string, statusData: {
        messageId?: string;
        providerMessageId?: string;
        status: string;
        conversationId?: string;
    }): void;
}
