export declare class ChatEngineeringDto {
    message: string;
    history?: {
        role: 'user' | 'assistant' | 'system';
        content: string;
    }[];
    contextItemId?: string;
}
