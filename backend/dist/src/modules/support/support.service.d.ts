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
        isSuperAdmin?: boolean;
        targetTenantId?: string;
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
            subject: string;
            description: string;
            userId: string | null;
            category: string;
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
    findOne(id: string, tenantId: string, isSuperAdmin?: boolean): Promise<{
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
            senderName: string | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            senderId: string | null;
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
        subject: string;
        description: string;
        userId: string | null;
        category: string;
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
            senderName: string | null;
            attachments: import("@prisma/client/runtime/library").JsonValue | null;
            senderId: string | null;
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
        subject: string;
        description: string;
        userId: string | null;
        category: string;
        priority: string;
        ticketNumber: number;
        assignedToId: string | null;
    }>;
    addMessage(ticketId: string, tenantId: string, userId: string, dto: CreateTicketMessageDto, isSuperAdmin?: boolean): Promise<{
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
        senderName: string | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        senderId: string | null;
        ticketId: string;
        senderRole: string;
    }>;
    updateStatus(ticketId: string, tenantId: string, status: string, isSuperAdmin?: boolean): Promise<{
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
        subject: string;
        description: string;
        userId: string | null;
        category: string;
        priority: string;
        ticketNumber: number;
        assignedToId: string | null;
    }>;
    assign(ticketId: string, tenantId: string, assignedToId: string | null, isSuperAdmin?: boolean): Promise<{
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
        subject: string;
        description: string;
        userId: string | null;
        category: string;
        priority: string;
        ticketNumber: number;
        assignedToId: string | null;
    }>;
    getNotices(tenantId: string): Promise<{
        systemStatus: {
            id: string;
            name: string;
            status: string;
            label: string;
            indicator: string;
        }[];
        announcements: {
            id: string;
            title: string;
            badge: string;
            date: string;
            description: string;
        }[];
    }>;
}
