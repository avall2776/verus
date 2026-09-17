export declare class CreateEngineeringItemDto {
    title: string;
    description: string;
    stage?: string;
    priority?: string;
    category?: string;
    sourceType?: string;
    sourceTicketId?: string;
    tenantName?: string;
    aiSummary?: string;
    technicalNotes?: string;
    tags?: string[];
    estimatedHours?: number;
    assignedTo?: string;
}
