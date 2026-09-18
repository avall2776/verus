import { SetMetadata } from '@nestjs/common';

export const REQUIRE_MODULE_KEY = 'require_module';

export type PlanModuleName =
  | 'crm'
  | 'aiAgent'
  | 'proposalsContracts'
  | 'automations'
  | 'emailInbox'
  | 'analytics'
  | 'goals'
  | 'support'
  | 'teamChat'
  | 'whatsapp';

/**
 * Decorator para proteger controllers ou endpoints que exigem módulos pagos da matriz de planos.
 * Exemplo de uso: @RequireModule('crm') ou @RequireModule(['crm', 'proposalsContracts'])
 */
export const RequireModule = (...modules: PlanModuleName[]) =>
  SetMetadata(REQUIRE_MODULE_KEY, modules);
