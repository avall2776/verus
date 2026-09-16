import { CreatePlanDto } from './create-plan.dto';
export declare class CreateTenantDto {
    name: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    address?: string;
    planId?: string;
    customPlan?: CreatePlanDto;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
}
