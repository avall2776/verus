import { PrismaService } from '../../shared/database/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
export declare class SupportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, filters: {
        status?: string;
        priority?: string;
        category?: string;
        search?: string;
        userId?: string;
    }): Promise<{
        tickets: ({
            contact: {
                id: string;
                name: string;
                phone: string;
                email: string;
            };
            _count: {
                messages: number;
            };
            assignedTo: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string;
                role: string;
            };
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string;
                role: string;
            };
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string | null;
            status: string;
            description: string;
            userId: string | null;
            category: string;
            subject: string;
            priority: string;
            ticketNumber: number;
            assignedToId: string | null;
        })[];
        counts: {
            total: number;
            open: number;
            inProgress: number;
            waitingClient: number;
            resolved: number;
            closed: number;
        };
    }>;
    findOne(id: string, tenantId: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string;
            email: string;
        };
        messages: ({
            sender: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string;
                role: string;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            isInternal: boolean;
            senderId: string | null;
            senderName: string | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            ticketId: string;
            senderRole: string;
        })[];
        assignedTo: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
        };
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string | null;
        status: string;
        description: string;
        userId: string | null;
        category: string;
        subject: string;
        priority: string;
        ticketNumber: number;
        assignedToId: string | null;
    }>;
    create(tenantId: string, userId: string, dto: CreateTicketDto): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            content: string;
            isInternal: boolean;
            senderId: string | null;
            senderName: string | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            ticketId: string;
            senderRole: string;
        }[];
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string | null;
        status: string;
        description: string;
        userId: string | null;
        category: string;
        subject: string;
        priority: string;
        ticketNumber: number;
        assignedToId: string | null;
    }>;
    addMessage(ticketId: string, tenantId: string, userId: string, dto: CreateTicketMessageDto): Promise<{
        sender: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        isInternal: boolean;
        senderId: string | null;
        senderName: string | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        ticketId: string;
        senderRole: string;
    }>;
    updateStatus(ticketId: string, tenantId: string, status: string): Promise<{
        assignedTo: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
        };
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string | null;
        status: string;
        description: string;
        userId: string | null;
        category: string;
        subject: string;
        priority: string;
        ticketNumber: number;
        assignedToId: string | null;
    }>;
    assign(ticketId: string, tenantId: string, assignedToId: string | null): Promise<{
        assignedTo: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        contactId: string | null;
        status: string;
        description: string;
        userId: string | null;
        category: string;
        subject: string;
        priority: string;
        ticketNumber: number;
        assignedToId: string | null;
    }>;
}
