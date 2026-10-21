import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { AutomationsService } from '../automations/automations.service';
import { CreateLeadDto } from './dto/create-lead.dto';
export declare class PublicApiService {
    private readonly prisma;
    private readonly chatGateway?;
    private readonly automationsService?;
    private readonly logger;
    constructor(prisma: PrismaService, chatGateway?: ChatGateway, automationsService?: AutomationsService);
    private normalizePhone;
    createLead(tenantId: string, dto: CreateLeadDto): Promise<{
        success: boolean;
        message: string;
        data: {
            contact: {
                id: string;
                name: string;
                phone: string;
                email: string;
                source: string;
            };
            deal: {
                id: string;
                title: string;
                value: import("@prisma/client/runtime/library").Decimal;
                stage: string;
                assignedTo: string;
                createdAt: Date;
            };
            conversation: {
                id: string;
                status: string;
            };
        };
    }>;
    getFunnels(tenantId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string;
            is_default: boolean;
            stages: {
                id: string;
                name: string;
                color: string;
                position: number;
            }[];
        }[];
    }>;
    getUsers(tenantId: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            email: string;
            role: string;
            isOnline: boolean;
        }[];
    }>;
    createContact(tenantId: string, data: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    createDeal(tenantId: string, data: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            contactId: string;
            assignedTo: string | null;
            status: string;
            title: string;
            value: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
    }>;
}
