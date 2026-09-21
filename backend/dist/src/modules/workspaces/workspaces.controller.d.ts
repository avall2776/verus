import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
export declare class WorkspacesController {
    private readonly workspacesService;
    constructor(workspacesService: WorkspacesService);
    list(tenantId: string): Promise<{
        workspaces: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            logoUrl: string | null;
            description: string | null;
            isDefault: boolean;
            themeColor: string | null;
        }[];
        metrics: {
            total: number;
            max: number;
            available: number;
            isLimitReached: boolean;
            planName: string;
        };
    }>;
    create(tenantId: string, dto: CreateWorkspaceDto): Promise<{
        message: string;
        workspace: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            logoUrl: string | null;
            description: string | null;
            isDefault: boolean;
            themeColor: string | null;
        };
    }>;
    update(tenantId: string, id: string, dto: UpdateWorkspaceDto): Promise<{
        message: string;
        workspace: {
            id: string;
            name: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            logoUrl: string | null;
            description: string | null;
            isDefault: boolean;
            themeColor: string | null;
        };
    }>;
    delete(tenantId: string, id: string): Promise<{
        message: string;
    }>;
}
