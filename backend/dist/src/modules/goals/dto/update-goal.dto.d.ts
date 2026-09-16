export declare class UpdateGoalDto {
    title?: string;
    userId?: string;
    targetType?: 'REVENUE' | 'DEALS' | 'LEADS';
    targetValue?: number;
    periodStart?: string;
    periodEnd?: string;
}
