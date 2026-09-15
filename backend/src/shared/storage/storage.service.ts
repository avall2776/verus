import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';

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

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabaseClient: SupabaseClient | null = null;
  private readonly bucketName: string;

  constructor() {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'versus-media';

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://aoxajwlocxetfxthkdxa.supabase.co';

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && supabaseKey !== 'dummy') {
      try {
        this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.logger.log(
          `[StorageService] Supabase Storage inicializado para o bucket "${this.bucketName}" (${supabaseUrl})`,
        );
      } catch (err: any) {
        this.logger.error(
          `[StorageService] Falha ao inicializar Supabase Client: ${err.message}`,
        );
        this.supabaseClient = null;
      }
    } else {
      this.logger.warn(
        `[StorageService] Chaves do Supabase não encontradas ou inválidas no backend. Fallback local ativo por padrão.`,
      );
    }
  }

  /**
   * Realiza o upload de um arquivo para o Supabase Storage (bucket configurado, ex: versus-media).
   * Caso o bucket não exista, ocorra erro de autenticação ou qualquer falha de rede/binário,
   * ativa automaticamente o fallback local salvando em uploads/media/ e gerando URL pública acessível.
   */
  async uploadFile(
    file: { buffer: Buffer; originalname: string; mimetype?: string },
    folder = 'chat',
  ): Promise<UploadResult> {
    const rawName = file.originalname || 'file';
    const sanitizedExt = path.extname(rawName).toLowerCase() || '';
    const baseName = path
      .basename(rawName, sanitizedExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);

    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${baseName}${sanitizedExt}`;

    // 1. Tenta envio para o Supabase Storage se o client estiver instanciado
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
          this.logger.log(
            `[StorageService] ✅ Upload realizado com sucesso no Supabase Storage [bucket: "${this.bucketName}"]: ${publicUrl}`,
          );

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
        } else {
          this.logger.warn(
            `[StorageService] ⚠️ Falha ao subir para Supabase Storage (bucket: "${this.bucketName}"): ${error?.message || JSON.stringify(error)}. Ativando fallback local...`,
          );
        }
      } catch (uploadErr: any) {
        this.logger.warn(
          `[StorageService] ⚠️ Exceção ao subir para Supabase Storage: ${uploadErr.message}. Ativando fallback local...`,
        );
      }
    }

    // 2. Fallback Robusto Local (uploads/media/)
    try {
      const localDir = path.join(process.cwd(), 'uploads', 'media');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      const localFilePath = path.join(localDir, uniqueFilename);
      await fs.promises.writeFile(localFilePath, file.buffer);

      const publicUrl = `/api-backend/media/file/${uniqueFilename}`;
      this.logger.log(
        `[StorageService] 🛡️ Fallback local ativado com sucesso: ${localFilePath} -> ${publicUrl}`,
      );

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
    } catch (localErr: any) {
      this.logger.error(
        `[StorageService] ❌ Erro crítico ao salvar arquivo no fallback local: ${localErr.message}`,
      );
      throw localErr;
    }
  }

  /**
   * Obtém o caminho absoluto e metadados de um arquivo local para download / streaming
   */
  getLocalFilePath(filename: string): string | null {
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
}
