import { Response } from 'express';
import { StorageService } from '../../shared/storage/storage.service';
export declare class MediaController {
    private readonly storageService;
    constructor(storageService: StorageService);
    uploadMedia(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        storageType: "supabase" | "local";
        filename: string;
        originalname: string;
        mimetype?: string;
        size?: number;
        bucket: string;
        path: string;
        success: boolean;
    }>;
    getFile(filename: string, res: Response): void;
    getAudioFile(filename: string, res: Response): void;
}
