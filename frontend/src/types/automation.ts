export type TriggerType =
  | 'PROPOSAL_ACCEPTED'
  | 'DEAL_CREATED'
  | 'DEAL_STAGE_CHANGED'
  | 'CONTRACT_SIGNED'
  | 'MESSAGE_RECEIVED'
  | 'TAG_ADDED'
  | 'INACTIVITY_TIMEOUT';

export type ActionType =
  | 'SEND_WHATSAPP'
  | 'UPDATE_DEAL_STAGE'
  | 'CREATE_TASK'
  | 'ADD_TAG'
  | 'NOTIFY_USER';

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  triggerType: TriggerType | string;
  triggerConditions?: Record<string, any>;
  conditions?: Record<string, any>;
  actionType?: ActionType | string;
  actionPayload?: Record<string, any>;
  actions?: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    logs: number;
  };
}

export interface AutomationLog {
  id: string;
  tenantId: string;
  automationId: string;
  automation: {
    id: string;
    name: string;
    triggerType: string;
    actionType?: string;
  };
  contactId?: string | null;
  contact?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  } | null;
  dealId?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING';
  payloadDetails?: any;
  errorReason?: string | null;
  error?: string | null;
  executedAt: string;
}

export interface DynamicVariable {
  tag: string;
  label: string;
  example: string;
}
