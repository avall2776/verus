export declare function getGoogleOAuthUrl(tenantId: string): string;
export declare function exchangeCodeForTokens(code: string, tenantId?: string): Promise<{
    success: boolean;
    email?: string;
    error?: string;
}>;
export declare function getValidGoogleAccessToken(tenantId?: string): Promise<string | null>;
export declare function isGoogleDriveConnected(tenantId?: string): {
    connected: boolean;
    email?: string;
};
export declare function uploadBufferToGoogleDrive(fileBuffer: Buffer, originalFilename: string, mimeType: string, parentFolderId?: string, tenantId?: string): Promise<{
    fileId: string;
    webViewLink: string;
    webContentLink: string;
    fileName: string;
}>;
