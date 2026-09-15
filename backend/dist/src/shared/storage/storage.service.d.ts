export interface UploadResult {
    url: string;
    storageType: 'supabase' | 'local';
    filename: string;
    originalname: string;
    mimetype?: string;
    size?: number;
    bucket: string;
    path: string;
}
export declare class StorageService {
    private readonly logger;
    private supabaseClient;
    private readonly bucketName;
    constructor();
    uploadFile(file: {
        buffer: Buffer;
        originalname: string;
        mimetype?: string;
    }, folder?: string): Promise<UploadResult>;
    getLocalFilePath(filename: string): string | null;
}
