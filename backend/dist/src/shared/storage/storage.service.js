"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");
let StorageService = StorageService_1 = class StorageService {
    constructor() {
        this.logger = new common_1.Logger(StorageService_1.name);
        this.supabaseClient = null;
        this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'versus-media';
        const supabaseUrl = process.env.SUPABASE_URL ||
            process.env.NEXT_PUBLIC_SUPABASE_URL ||
            'https://aoxajwlocxetfxthkdxa.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey && supabaseKey !== 'dummy') {
            try {
                this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                    },
                });
                this.logger.log(`[StorageService] Supabase Storage inicializado para o bucket "${this.bucketName}" (${supabaseUrl})`);
            }
            catch (err) {
                this.logger.error(`[StorageService] Falha ao inicializar Supabase Client: ${err.message}`);
                this.supabaseClient = null;
            }
        }
        else {
            this.logger.warn(`[StorageService] Chaves do Supabase não encontradas ou inválidas no backend. Fallback local ativo por padrão.`);
        }
    }
    async uploadFile(file, folder = 'chat') {
        const rawName = file.originalname || 'file';
        const sanitizedExt = path.extname(rawName).toLowerCase() || '';
        const baseName = path
            .basename(rawName, sanitizedExt)
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 40);
        const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${baseName}${sanitizedExt}`;
        if (this.supabaseClient) {
            try {
                const filePath = `${folder}/${uniqueFilename}`;
                const contentType = file.mimetype || 'application/octet-stream';
                const { data, error } = await this.supabaseClient.storage
                    .from(this.bucketName)
                    .upload(filePath, file.buffer, {
                    contentType,
                    upsert: false,
                });
                if (!error && data) {
                    const { data: publicUrlData } = this.supabaseClient.storage
                        .from(this.bucketName)
                        .getPublicUrl(filePath);
                    const publicUrl = publicUrlData.publicUrl;
                    this.logger.log(`[StorageService] ✅ Upload realizado com sucesso no Supabase Storage [bucket: "${this.bucketName}"]: ${publicUrl}`);
                    return {
                        url: publicUrl,
                        storageType: 'supabase',
                        filename: uniqueFilename,
                        originalname: rawName,
                        mimetype: file.mimetype,
                        size: file.buffer?.length,
                        bucket: this.bucketName,
                        path: filePath,
                    };
                }
                else {
                    this.logger.warn(`[StorageService] ⚠️ Falha ao subir para Supabase Storage (bucket: "${this.bucketName}"): ${error?.message || JSON.stringify(error)}. Ativando fallback local...`);
                }
            }
            catch (uploadErr) {
                this.logger.warn(`[StorageService] ⚠️ Exceção ao subir para Supabase Storage: ${uploadErr.message}. Ativando fallback local...`);
            }
        }
        try {
            const localDir = path.join(process.cwd(), 'uploads', 'media');
            if (!fs.existsSync(localDir)) {
                fs.mkdirSync(localDir, { recursive: true });
            }
            const localFilePath = path.join(localDir, uniqueFilename);
            await fs.promises.writeFile(localFilePath, file.buffer);
            const publicUrl = `/api-backend/media/file/${uniqueFilename}`;
            this.logger.log(`[StorageService] 🛡️ Fallback local ativado com sucesso: ${localFilePath} -> ${publicUrl}`);
            return {
                url: publicUrl,
                storageType: 'local',
                filename: uniqueFilename,
                originalname: rawName,
                mimetype: file.mimetype,
                size: file.buffer?.length,
                bucket: 'local-fallback',
                path: localFilePath,
            };
        }
        catch (localErr) {
            this.logger.error(`[StorageService] ❌ Erro crítico ao salvar arquivo no fallback local: ${localErr.message}`);
            throw localErr;
        }
    }
    getLocalFilePath(filename) {
        const safeFilename = path.basename(filename);
        const searchDirs = [
            path.join(process.cwd(), 'uploads', 'media', safeFilename),
            path.join(process.cwd(), 'uploads', 'audio', safeFilename),
            path.join(process.cwd(), 'uploads', safeFilename),
        ];
        for (const testPath of searchDirs) {
            if (fs.existsSync(testPath)) {
                return testPath;
            }
        }
        return null;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map