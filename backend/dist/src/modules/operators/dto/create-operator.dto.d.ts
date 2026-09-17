export declare class CreateOperatorDto {
    name: string;
    email: string;
    roleTitle?: string;
    role?: string;
    permissions?: Record<string, boolean>;
    password?: string;
    sendEmail?: boolean;
}
