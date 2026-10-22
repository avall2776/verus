export declare function extractGoogleDriveId(urlOrId?: string | null): string | null;
export declare function isGoogleDriveUrl(url?: string | null): boolean;
export declare function detectMediaType(filenameOrUrl?: string | null, explicitType?: string | null): 'document' | 'image' | 'video';
export declare function getMimeType(filenameOrExt: string, fallbackType?: 'document' | 'image' | 'video'): string;
export declare function downloadDriveFileBuffer(driveFileId: string, apiKey?: string): Promise<{
    buffer: Buffer;
    mimeType: string;
} | null>;
