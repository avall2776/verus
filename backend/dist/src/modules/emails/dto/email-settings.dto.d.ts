export declare class EmailSettingsDto {
    provider: 'gmail' | 'hostinger' | 'smtp' | 'resend';
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPass?: string;
    fromName?: string;
    fromEmail?: string;
    resendApiKey?: string;
    isActive?: boolean;
    hasPassword?: boolean;
    configured?: boolean;
    connected?: boolean;
    connectionError?: string | null;
    source?: string;
}
