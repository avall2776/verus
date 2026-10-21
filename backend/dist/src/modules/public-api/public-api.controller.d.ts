import { PublicApiService } from './public-api.service';
import { CreateLeadDto } from './dto/create-lead.dto';
export declare class PublicApiController {
    private readonly publicApiService;
    constructor(publicApiService: PublicApiService);
    checkHealth(req: any): Promise<{
        success: boolean;
        status: string;
        tenantId: any;
        tenantName: any;
        tokenName: any;
        authenticatedAt: string;
        version: string;
    }>;
    createLead(req: any, body: CreateLeadDto): Promise<{
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
    getFunnels(req: any): Promise<{
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
    getUsers(req: any): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            email: string;
            role: string;
            isOnline: boolean;
        }[];
    }>;
    createContact(req: any, body: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    createDeal(req: any, body: any): Promise<{
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
