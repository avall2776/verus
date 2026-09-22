import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
export declare class OperatorsController {
    private readonly operatorsService;
    constructor(operatorsService: OperatorsService);
    private checkSuperAdmin;
    findAll(req: any): Promise<{
        operators: {
            roleTitle: any;
            savedPassword: string;
            metrics: {
                todayAttendances: number;
                todayResolved: number;
                activeTicketsCount: number;
                avgResponseMinutes: any;
                resolutionRate: number;
            };
            activeTickets: ({
                tenant: {
                    id: string;
                    name: string;
                    cnpj: string;
                };
                _count: {
                    messages: number;
                };
                user: {
                    id: string;
                    name: string;
                    email: string;
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
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            rawPasswordEncrypted: string;
            role: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isOnline: boolean;
        }[];
        overview: {
            totalOperators: number;
            onlineOperators: number;
            totalAttendancesToday: number;
            totalResolvedToday: number;
            globalAvgResponseTime: number;
            globalResolutionRate: number;
        };
    }>;
    getLiveChats(req: any, id: string): Promise<{
        operator: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string;
            role: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        };
        activeTickets: ({
            tenant: {
                id: string;
                name: string;
                phone: string;
                email: string;
                plan: {
                    name: string;
                };
                cnpj: string;
            };
            messages: ({
                sender: {
                    id: string;
                    name: string;
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
            user: {
                id: string;
                name: string;
                email: string;
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
    }>;
    create(req: any, dto: CreateOperatorDto): Promise<{
        operator: {
            id: string;
            name: string;
            email: string;
            createdAt: Date;
            isActive: boolean;
            role: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        };
        tempPassword: string;
        emailSent: boolean;
        emailError: string;
        message: string;
    }>;
    update(req: any, id: string, dto: UpdateOperatorDto): Promise<{
        id: string;
        name: string;
        email: string;
        updatedAt: Date;
        isActive: boolean;
        role: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }>;
    delete(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
