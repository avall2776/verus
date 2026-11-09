export interface ClientTelemetry {
    ip: string;
    city: string;
    state: string;
    country: string;
    device: string;
    browser: string;
    userAgent: string;
}
export declare function extractClientIp(req: any): string;
export declare function parseDeviceAndBrowser(userAgentHeader?: string): {
    device: string;
    browser: string;
};
export declare function isMobilePlatform(userAgent?: string, device?: string): boolean;
export declare function resolveClientLocation(ip: string): Promise<{
    city: string;
    state: string;
    country: string;
}>;
export declare function extractFullTelemetry(req: any): Promise<ClientTelemetry>;
