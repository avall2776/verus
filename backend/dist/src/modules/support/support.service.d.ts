import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SupportAiService } from './support-ai.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { UpdateSupportAiConfigDto } from './dto/update-support-ai-config.dto';
import { SubmitCsatDto } from './dto/submit-csat.dto';
export declare class SupportService {
    private readonly prisma;
    private readonly configService;
    private readonly supportAiService;
    private readonly chatGateway;
    private readonly logger;
    private readonly openai;
    constructor(prisma: PrismaService, configService: ConfigService, supportAiService: SupportAiService, chatGateway: ChatGateway);
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
            priority: string;
            userId: string | null;
            category: string;
            ticketNumber: number;
            assignedToId: string | null;
            isAiPaused: boolean;
            satisfactionRating: number | null;
            satisfactionFeedback: string | null;
            aiHandoffDemandId: string | null;
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
        priority: string;
        userId: string | null;
        category: string;
        ticketNumber: number;
        assignedToId: string | null;
        isAiPaused: boolean;
        satisfactionRating: number | null;
        satisfactionFeedback: string | null;
        aiHandoffDemandId: string | null;
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
        priority: string;
        userId: string | null;
        category: string;
        ticketNumber: number;
        assignedToId: string | null;
        isAiPaused: boolean;
        satisfactionRating: number | null;
        satisfactionFeedback: string | null;
        aiHandoffDemandId: string | null;
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
        priority: string;
        userId: string | null;
        category: string;
        ticketNumber: number;
        assignedToId: string | null;
        isAiPaused: boolean;
        satisfactionRating: number | null;
        satisfactionFeedback: string | null;
        aiHandoffDemandId: string | null;
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
        priority: string;
        userId: string | null;
        category: string;
        ticketNumber: number;
        assignedToId: string | null;
        isAiPaused: boolean;
        satisfactionRating: number | null;
        satisfactionFeedback: string | null;
        aiHandoffDemandId: string | null;
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
    generateCopilotSuggestion(ticketId: string, tenantId: string, isSuperAdmin?: boolean): Promise<any>;
    getAiConfig(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        model: string;
        prompt: string;
        knowledgeBase: string;
        guardrails: string;
        autoHandoffCrm: boolean;
        autoCloseSolved: boolean;
    }>;
    updateAiConfig(dto: UpdateSupportAiConfigDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        model: string;
        prompt: string;
        knowledgeBase: string;
        guardrails: string;
        autoHandoffCrm: boolean;
        autoCloseSolved: boolean;
    }>;
    toggleTicketAi(ticketId: string, isPaused: boolean, tenantId?: string, isSuperAdmin?: boolean): Promise<{
        tenant: {
            id: string;
            name: string;
            phone: string | null;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            cnpj: string | null;
            logoUrl: string | null;
            leadNotificationPhone: string | null;
            address: string | null;
            isActive: boolean;
            aiEnabled: boolean;
            aiName: string | null;
            aiModel: string;
            aiPrompt: string | null;
            aiKnowledgeBase: string | null;
            aiTemperature: number;
            aiTrialStartedAt: Date | null;
            aiTrialDays: number;
            aiPlatformKeyAllowed: boolean;
            aiCustomApiKey: string | null;
            aiKeyType: string;
            aiKeyStatus: string;
            aiLastKeyTestAt: Date | null;
            aiTrialWarningSent: boolean;
            metaToken: string | null;
            metaPhoneNumberId: string | null;
            whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
            emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
            planId: string;
        };
        messages: ({
            sender: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                password: string;
                role: string;
                isSuperAdmin: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue | null;
                isOnline: boolean;
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
            avatarUrl: string | null;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            password: string;
            role: string;
            isSuperAdmin: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue | null;
            isOnline: boolean;
        };
        user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            password: string;
            role: string;
            isSuperAdmin: boolean;
            permissions: import("@prisma/client/runtime/library").JsonValue | null;
            isOnline: boolean;
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
        priority: string;
        userId: string | null;
        category: string;
        ticketNumber: number;
        assignedToId: string | null;
        isAiPaused: boolean;
        satisfactionRating: number | null;
        satisfactionFeedback: string | null;
        aiHandoffDemandId: string | null;
    }>;
    submitCsat(ticketId: string, tenantId: string, dto: SubmitCsatDto): Promise<{
        message: string;
        ticket: {
            tenant: {
                id: string;
                name: string;
                phone: string | null;
                email: string | null;
                createdAt: Date;
                updatedAt: Date;
                cnpj: string | null;
                logoUrl: string | null;
                leadNotificationPhone: string | null;
                address: string | null;
                isActive: boolean;
                aiEnabled: boolean;
                aiName: string | null;
                aiModel: string;
                aiPrompt: string | null;
                aiKnowledgeBase: string | null;
                aiTemperature: number;
                aiTrialStartedAt: Date | null;
                aiTrialDays: number;
                aiPlatformKeyAllowed: boolean;
                aiCustomApiKey: string | null;
                aiKeyType: string;
                aiKeyStatus: string;
                aiLastKeyTestAt: Date | null;
                aiTrialWarningSent: boolean;
                metaToken: string | null;
                metaPhoneNumberId: string | null;
                whatsappSettings: import("@prisma/client/runtime/library").JsonValue | null;
                emailSettings: import("@prisma/client/runtime/library").JsonValue | null;
                planId: string;
            };
            messages: ({
                sender: {
                    id: string;
                    name: string;
                    email: string;
                    avatarUrl: string | null;
                    tenantId: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isActive: boolean;
                    password: string;
                    role: string;
                    isSuperAdmin: boolean;
                    permissions: import("@prisma/client/runtime/library").JsonValue | null;
                    isOnline: boolean;
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
                avatarUrl: string | null;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                password: string;
                role: string;
                isSuperAdmin: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue | null;
                isOnline: boolean;
            };
            user: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                password: string;
                role: string;
                isSuperAdmin: boolean;
                permissions: import("@prisma/client/runtime/library").JsonValue | null;
                isOnline: boolean;
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
            priority: string;
            userId: string | null;
            category: string;
            ticketNumber: number;
            assignedToId: string | null;
            isAiPaused: boolean;
            satisfactionRating: number | null;
            satisfactionFeedback: string | null;
            aiHandoffDemandId: string | null;
        };
    }>;
}
