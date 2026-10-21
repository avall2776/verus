export declare class CreateMarketingCardDto {
    marketingClientId: string;
    title: string;
    description?: string;
    format?: string;
    status?: string;
    position?: number;
    dueDate?: string;
    publishDate?: string;
    priority?: string;
    assignedUserId?: string;
    value?: number;
    checklist?: Array<{
        id: string;
        text: string;
        completed: boolean;
    }>;
    attachments?: Array<{
        id: string;
        name: string;
        url: string;
        type: string;
    }>;
}
