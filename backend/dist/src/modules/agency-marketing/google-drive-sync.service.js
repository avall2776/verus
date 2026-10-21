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
var GoogleDriveSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveSyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const axios_1 = require("axios");
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
let GoogleDriveSyncService = GoogleDriveSyncService_1 = class GoogleDriveSyncService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GoogleDriveSyncService_1.name);
        this.syncConfigs = new Map();
    }
    extractFolderId(urlOrId) {
        if (!urlOrId)
            return null;
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
    getSyncConfig(tenantId) {
        const config = this.syncConfigs.get(tenantId) || {};
        return {
            rootFolderUrl: config.rootFolderUrl || process.env.GOOGLE_DRIVE_ROOT_FOLDER || '',
            apiKeyConfigured: Boolean(config.apiKey || process.env.GOOGLE_DRIVE_API_KEY),
            autoSync: config.autoSync ?? true,
            lastSyncAt: config.lastSyncAt || null,
            lastStats: config.lastStats || null,
        };
    }
    saveSyncConfig(tenantId, data) {
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
    async syncTenantDrive(tenantId, options) {
        const savedConfig = this.syncConfigs.get(tenantId) || {};
        const rootFolderInput = options?.rootFolderUrl || savedConfig.rootFolderUrl || process.env.GOOGLE_DRIVE_ROOT_FOLDER;
        const apiKey = options?.apiKey || savedConfig.apiKey || process.env.GOOGLE_DRIVE_API_KEY;
        if (!rootFolderInput) {
            throw new common_1.BadRequestException('Informe o link ou ID da Pasta Raiz do Google Drive (onde estão as pastas dos clientes).');
        }
        const rootFolderId = this.extractFolderId(rootFolderInput);
        if (!rootFolderId) {
            throw new common_1.BadRequestException('Não foi possível identificar o ID da pasta do Google Drive.');
        }
        if (!apiKey) {
            throw new common_1.BadRequestException('Chave da Google Drive API não configurada. Informe uma Chave de API do Google Cloud para permitir o monitoramento automático das pastas.');
        }
        const autoCreateClients = options?.autoCreateClients ?? true;
        const stats = {
            clientsScanned: 0,
            clientsCreated: 0,
            cardsScanned: 0,
            cardsCreated: 0,
            details: [],
        };
        try {
            this.logger.log(`[DRIVE_SYNC] Iniciando varredura na pasta raiz: ${rootFolderId}`);
            const foldersResponse = await axios_1.default.get('https://www.googleapis.com/drive/v3/files', {
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
                let client = await this.prisma.marketingClient.findFirst({
                    where: {
                        tenantId,
                        name: { equals: clientName, mode: 'insensitive' },
                    },
                });
                if (!client && autoCreateClients) {
                    const randomColor = DEFAULT_BRAND_COLORS[Math.floor(Math.random() * DEFAULT_BRAND_COLORS.length)];
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
                const files = await this.collectMediaFiles(folder.id, apiKey);
                stats.cardsScanned += files.length;
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
                    const alreadyImported = existingCards.some((c) => {
                        const atts = Array.isArray(c.attachments) ? c.attachments : [];
                        return atts.some((a) => a?.url?.includes(fileId) || a?.id === `drive-${fileId}`);
                    });
                    if (alreadyImported) {
                        continue;
                    }
                    let format = 'POST';
                    const isVideo = mimeType.includes('video') ||
                        fileName.endsWith('.mp4') ||
                        fileName.endsWith('.mov') ||
                        fileName.toLowerCase().includes('reels') ||
                        fileName.toLowerCase().includes('video');
                    if (isVideo) {
                        format = 'REELS';
                    }
                    else if (fileName.toLowerCase().includes('carrossel')) {
                        format = 'CARROSSEL';
                    }
                    else if (fileName.toLowerCase().includes('stories')) {
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
            const now = new Date().toISOString();
            const updatedConfig = {
                ...savedConfig,
                rootFolderUrl: rootFolderInput,
                lastSyncAt: now,
                lastStats: stats,
            };
            this.syncConfigs.set(tenantId, updatedConfig);
            this.logger.log(`[DRIVE_SYNC] Sincronização concluída com sucesso! ${stats.clientsCreated} clientes criados, ${stats.cardsCreated} peças importadas.`);
            return {
                success: true,
                message: `Sincronização concluída! ${stats.clientsScanned} pastas verificadas, ${stats.clientsCreated} novos clientes criados e ${stats.cardsCreated} novas peças/vídeos importados com sucesso.`,
                stats,
            };
        }
        catch (err) {
            this.logger.error(`[DRIVE_SYNC_ERROR] Falha ao sincronizar: ${err?.message || err}`);
            if (err.response?.data?.error?.message) {
                throw new common_1.BadRequestException(`Erro na Google Drive API: ${err.response.data.error.message}`);
            }
            throw err;
        }
    }
    async collectMediaFiles(folderId, apiKey, currentPath = '', depth = 0) {
        if (depth > 4)
            return [];
        try {
            const res = await axios_1.default.get('https://www.googleapis.com/drive/v3/files', {
                params: {
                    q: `'${folderId}' in parents and trashed = false`,
                    fields: 'files(id, name, mimeType, size, webViewLink, createdTime)',
                    key: apiKey,
                    pageSize: 100,
                },
            });
            const items = res.data?.files || [];
            const mediaFiles = [];
            for (const item of items) {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                    const subFiles = await this.collectMediaFiles(item.id, apiKey, currentPath ? `${currentPath} / ${item.name}` : item.name, depth + 1);
                    mediaFiles.push(...subFiles);
                }
                else {
                    mediaFiles.push({
                        ...item,
                        folderPath: currentPath,
                    });
                }
            }
            return mediaFiles;
        }
        catch (err) {
            this.logger.warn(`[DRIVE_COLLECT] Aviso ao ler pasta ${folderId} (${currentPath}): ${err?.message || err}`);
            return [];
        }
    }
};
exports.GoogleDriveSyncService = GoogleDriveSyncService;
exports.GoogleDriveSyncService = GoogleDriveSyncService = GoogleDriveSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoogleDriveSyncService);
//# sourceMappingURL=google-drive-sync.service.js.map