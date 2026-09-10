import { DepartmentsService } from './departments.service';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    create(req: any, body: {
        name: string;
        color?: string;
    }): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string | null;
    }>;
    findAll(req: any): Promise<({
        users: ({
            user: {
                id: string;
                name: string;
                email: string;
                tenantId: string;
                createdAt: Date;
                updatedAt: Date;
                password: string;
                role: string;
                isOnline: boolean;
            };
        } & {
            departmentId: string;
            userId: string;
        })[];
    } & {
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        color: string | null;
    })[]>;
    addUser(req: any, id: string, body: {
        userId: string;
    }): Promise<{
        departmentId: string;
        userId: string;
    }>;
    removeUser(req: any, id: string, userId: string): Promise<{
        departmentId: string;
        userId: string;
    }>;
}
