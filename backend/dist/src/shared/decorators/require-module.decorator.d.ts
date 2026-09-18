export declare const REQUIRE_MODULE_KEY = "require_module";
export type PlanModuleName = 'crm' | 'aiAgent' | 'proposalsContracts' | 'automations' | 'emailInbox' | 'analytics' | 'goals' | 'support' | 'teamChat' | 'whatsapp';
export declare const RequireModule: (...modules: PlanModuleName[]) => import("@nestjs/common").CustomDecorator<string>;
