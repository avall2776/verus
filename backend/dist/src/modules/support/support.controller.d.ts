import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    findAll(req: any, query: {
        status?: string;
        priority?: string;
        category?: string;
        search?: string;
        myOnly?: string;
        tenantId?: string;
    }): Promise<{
        tickets: ({
            contact: {
                id: string;
                name: string;
                phone: string;
                email: string;
            };
            tenant: {
                id: string;
                name: string;
                phone: string;
                email: string;
                plan: {
                    name: string;
                };
                cnpj: string;
                isActive: boolean;
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
    findOne(req: any, id: string): Promise<{
        contact: {
            id: string;
            name: string;
            phone: string;
            email: string;
        };
        tenant: {
            id: string;
            name: string;
            phone: string;
            email: string;
            createdAt: Date;
            _count: {
                supportTickets: number;
                users: number;
                contacts: number;
                contracts: number;
            };
            plan: {
                id: string;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
            };
            cnpj: string;
            logoUrl: string;
            address: string;
            isActive: boolean;
            metaPhoneNumberId: string;
            whatsappSettings: import("@prisma/client/runtime/library").JsonValue;
            emailSettings: import("@prisma/client/runtime/library").JsonValue;
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
    create(req: any, dto: CreateTicketDto): Promise<{
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
    addMessage(req: any, id: string, dto: CreateTicketMessageDto): Promise<{
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
    updateStatus(req: any, id: string, body: {
        status: string;
    }): Promise<{
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
    assign(req: any, id: string, body: {
        assignedToId: string | null;
    }): Promise<{
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
