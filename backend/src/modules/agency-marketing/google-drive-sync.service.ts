import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import axios from 'axios';

export interface DriveSyncStats {
  clientsScanned: number;
  clientsCreated: number;
  cardsScanned: number;
  cardsCreated: number;
  details: Array<{
    clientName: string;
    clientId: string;
    isNewClient: boolean;
    filesFound: number;
    cardsCreated: number;
  }>;
}

const DEFAULT_BRAND_COLORS = [
  '#00D2FF',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
];

@Injectable()
export class GoogleDriveSyncService {
  private readonly logger = new Logger(GoogleDriveSyncService.name);

  // Armazenamento em memória por tenant para configurações de sincronização do Drive
  private syncConfigs: Map<
    string,
    {
      rootFolderUrl?: string;
      apiKey?: string;
      autoSync?: boolean;
      lastSyncAt?: string;
      lastStats?: DriveSyncStats;
    }
  > = new Map();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Extrai o ID da pasta do Google Drive a partir da URL
   */
  extractFolderId(urlOrId?: string | null): string | null {
    if (!urlOrId) return null;
    const str = urlOrId.trim();

    if (/^[a-zA-Z0-9_-]{25,}$/.test(str)) {
      return str;
    }

    const patterns = [
      /\/folders\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
    ];

    for (const regex of patterns) {
      const match = str.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Obtém configuração atual de sincronização do Tenant
   */
  getSyncConfig(tenantId: string) {
    const config = this.syncConfigs.get(tenantId) || {};
    return {
      rootFolderUrl: config.rootFolderUrl || process.env.GOOGLE_DRIVE_ROOT_FOLDER || '',
      apiKeyConfigured: Boolean(config.apiKey || process.env.GOOGLE_DRIVE_API_KEY),
      autoSync: config.autoSync ?? true,
      lastSyncAt: config.lastSyncAt || null,
      lastStats: config.lastStats || null,
    };
  }

  /**
   * Salva configuração de sincronização do Tenant
   */
  saveSyncConfig(
    tenantId: string,
    data: { rootFolderUrl?: string; apiKey?: string; autoSync?: boolean },
  ) {
    const existing = this.syncConfigs.get(tenantId) || {};
    const updated = {
      ...existing,
      rootFolderUrl: data.rootFolderUrl !== undefined ? data.rootFolderUrl : existing.rootFolderUrl,
      apiKey: data.apiKey !== undefined && data.apiKey.trim() ? data.apiKey.trim() : existing.apiKey,
      autoSync: data.autoSync !== undefined ? data.autoSync : existing.autoSync ?? true,
    };
    this.syncConfigs.set(tenantId, updated);
    return this.getSyncConfig(tenantId);
  }

  /**
   * Executa a varredura do Google Drive:
   * 1. Lê a pasta raiz configurada
   * 2. Identifica cada subpasta como um Cliente
   * 3. Cria automaticamente o Cliente se não existir
   * 4. Lê os arquivos (fotos/vídeos) dentro de cada pasta de cliente
   * 5. Cria os cards no Kanban/Biblioteca de Mídia com thumbnails e players
   */
  async syncTenantDrive(
    tenantId: string,
    options?: {
      rootFolderUrl?: string;
      apiKey?: string;
      autoCreateClients?: boolean;
    },
  ): Promise<{ success: boolean; message: string; stats: DriveSyncStats }> {
    const savedConfig = this.syncConfigs.get(tenantId) || {};
    const rootFolderInput = options?.rootFolderUrl || savedConfig.rootFolderUrl || process.env.GOOGLE_DRIVE_ROOT_FOLDER;
    const apiKey = options?.apiKey || savedConfig.apiKey || process.env.GOOGLE_DRIVE_API_KEY;

    if (!rootFolderInput) {
      throw new BadRequestException(
        'Informe o link ou ID da Pasta Raiz do Google Drive (onde estão as pastas dos clientes).',
      );
    }

    const rootFolderId = this.extractFolderId(rootFolderInput);
    if (!rootFolderId) {
      throw new BadRequestException('Não foi possível identificar o ID da pasta do Google Drive.');
    }

    if (!apiKey) {
      throw new BadRequestException(
        'Chave da Google Drive API não configurada. Informe uma Chave de API do Google Cloud para permitir o monitoramento automático das pastas.',
      );
    }

    const autoCreateClients = options?.autoCreateClients ?? true;
    const stats: DriveSyncStats = {
      clientsScanned: 0,
      clientsCreated: 0,
      cardsScanned: 0,
      cardsCreated: 0,
      details: [],
    };

    try {
      this.logger.log(`[DRIVE_SYNC] Iniciando varredura na pasta raiz: ${rootFolderId}`);

      // 1. Listar subpastas na pasta raiz (cada subpasta é um Cliente)
      const foldersResponse = await axios.get('https://www.googleapis.com/drive/v3/files', {
        params: {
          q: `'${rootFolderId}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
          fields: 'files(id, name, webViewLink, createdTime)',
          key: apiKey,
          pageSize: 100,
        },
      });

      const clientFolders = foldersResponse.data?.files || [];
      stats.clientsScanned = clientFolders.length;

      this.logger.log(`[DRIVE_SYNC] Encontradas ${clientFolders.length} pastas de clientes.`);

      for (const folder of clientFolders) {
        const clientName = (folder.name || 'Cliente Sem Nome').trim();
        let isNewClient = false;

        // 2. Localiza ou cria o cliente
        let client = await this.prisma.marketingClient.findFirst({
          where: {
            tenantId,
            name: { equals: clientName, mode: 'insensitive' },
          },
        });

        if (!client && autoCreateClients) {
          const randomColor =
            DEFAULT_BRAND_COLORS[Math.floor(Math.random() * DEFAULT_BRAND_COLORS.length)];

          client = await this.prisma.marketingClient.create({
            data: {
              tenantId,
              name: clientName,
              brandColor: randomColor,
              planTier: 'Performance Pro (Drive Sync)',
              monthlyDeliverables: {
                materialsUrl: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
                posts: 12,
                reels: 4,
                stories: 20,
                history: [
                  {
                    id: crypto.randomUUID(),
                    action: 'Cliente criado automaticamente via sincronização do Google Drive',
                    author: 'Google Drive Bot',
                    date: new Date().toISOString(),
                  },
                ],
              },
            },
          });

          isNewClient = true;
          stats.clientsCreated++;
          this.logger.log(`[DRIVE_SYNC] Novo cliente criado automaticamente: ${clientName}`);
        }

        if (!client) {
          continue;
        }

        // 3. Buscar recursivamente todos os arquivos reais (fotos, vídeos) do cliente
        // Pastas vazias não geram cards fantasma.
        const files = await this.collectMediaFiles(folder.id, apiKey);
        stats.cardsScanned += files.length;

        // Buscar cards existentes deste cliente para não duplicar
        const existingCards = await this.prisma.marketingCard.findMany({
          where: {
            tenantId,
            marketingClientId: client.id,
          },
          select: {
            id: true,
            title: true,
            attachments: true,
          },
        });

        let clientCardsCreated = 0;

        for (const file of files) {
          const fileId = file.id;
          const fileName = (file.name || 'Criativo sem nome').trim();
          const mimeType = (file.mimeType || '').toLowerCase();

          // Verificar se já foi importado
          const alreadyImported = existingCards.some((c) => {
            const atts = Array.isArray(c.attachments) ? c.attachments : [];
            return atts.some((a: any) => a?.url?.includes(fileId) || a?.id === `drive-${fileId}`);
          });

          if (alreadyImported) {
            continue;
          }

          // Detectar formato
          let format = 'POST';
          const isVideo =
            mimeType.includes('video') ||
            fileName.endsWith('.mp4') ||
            fileName.endsWith('.mov') ||
            fileName.toLowerCase().includes('reels') ||
            fileName.toLowerCase().includes('video');

          if (isVideo) {
            format = 'REELS';
          } else if (fileName.toLowerCase().includes('carrossel')) {
            format = 'CARROSSEL';
          } else if (fileName.toLowerCase().includes('stories')) {
            format = 'STORIES';
          }

          const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
          const formattedSize = file.size
            ? `${(Number(file.size) / (1024 * 1024)).toFixed(1)} MB`
            : 'Google Drive (5 TB)';

          const driveUrl = file.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

          await this.prisma.marketingCard.create({
            data: {
              tenantId,
              marketingClientId: client.id,
              title: cleanTitle.toUpperCase(),
              description: `Mídia importada automaticamente da pasta do Google Drive do cliente "${clientName}".\nArquivo original: ${fileName}`,
              format,
              status: 'APROVACAO_CLIENTE',
              priority: 'MEDIA',
              attachments: [
                {
                  id: `drive-${fileId}`,
                  name: fileName,
                  url: driveUrl,
                  type: 'google-drive',
                  size: formattedSize,
                  date: 'Sincronizado do Drive',
                },
              ],
              metadata: {
                googleDriveFileId: fileId,
                originalFileName: fileName,
                syncedAt: new Date().toISOString(),
              },
            },
          });

          clientCardsCreated++;
          stats.cardsCreated++;
        }

        stats.details.push({
          clientName,
          clientId: client.id,
          isNewClient,
          filesFound: files.length,
          cardsCreated: clientCardsCreated,
        });
      }

      // Atualizar estatísticas salvas
      const now = new Date().toISOString();
      const updatedConfig = {
        ...savedConfig,
        rootFolderUrl: rootFolderInput,
        lastSyncAt: now,
        lastStats: stats,
      };
      this.syncConfigs.set(tenantId, updatedConfig);

      this.logger.log(
        `[DRIVE_SYNC] Sincronização concluída com sucesso! ${stats.clientsCreated} clientes criados, ${stats.cardsCreated} peças importadas.`,
      );

      return {
        success: true,
        message: `Sincronização concluída! ${stats.clientsScanned} pastas verificadas, ${stats.clientsCreated} novos clientes criados e ${stats.cardsCreated} novas peças/vídeos importados com sucesso.`,
        stats,
      };
    } catch (err: any) {
      this.logger.error(`[DRIVE_SYNC_ERROR] Falha ao sincronizar: ${err?.message || err}`);
      if (err.response?.data?.error?.message) {
        throw new BadRequestException(
          `Erro na Google Drive API: ${err.response.data.error.message}`,
        );
      }
      throw err;
    }
  }

  /**
   * Coleta recursivamente todos os arquivos reais (fotos, vídeos, artes)
   * dentro de uma pasta de cliente ou qualquer subpasta (ex: Campanhas, Formatos).
   * Pastas vazias são ignoradas, evitando a criação de cards fantasma.
   */
  private async collectMediaFiles(
    folderId: string,
    apiKey: string,
    currentPath = '',
    depth = 0,
  ): Promise<any[]> {
    if (depth > 4) return []; // Limite de profundidade de segurança

    try {
      const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
        params: {
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'files(id, name, mimeType, size, webViewLink, createdTime)',
          key: apiKey,
          pageSize: 100,
        },
      });

      const items = res.data?.files || [];
      const mediaFiles: any[] = [];

      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Entra recursivamente na subpasta para encontrar os arquivos reais
          const subFiles = await this.collectMediaFiles(
            item.id,
            apiKey,
            currentPath ? `${currentPath} / ${item.name}` : item.name,
            depth + 1,
          );
          mediaFiles.push(...subFiles);
        } else {
          // Arquivo real de mídia/documento
          mediaFiles.push({
            ...item,
            folderPath: currentPath,
          });
        }
      }

      return mediaFiles;
    } catch (err: any) {
      this.logger.warn(
        `[DRIVE_COLLECT] Aviso ao ler pasta ${folderId} (${currentPath}): ${err?.message || err}`,
      );
      return [];
    }
  }
}

