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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickRepliesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const google_drive_helper_1 = require("../../shared/helpers/google-drive.helper");
let QuickRepliesService = class QuickRepliesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        let replies = await this.prisma.quickReply.findMany({
            where: { tenantId },
            orderBy: { shortcut: 'asc' },
        });
        if (replies.length === 0) {
            const defaults = [
                {
                    shortcut: '/ola',
                    title: 'Saudação Padrão',
                    content: 'Olá! Como posso ajudar você hoje?',
                    type: 'text',
                },
                {
                    shortcut: '/catalogo',
                    title: 'Catálogo de Produtos e Serviços',
                    content: 'Confira nosso catálogo oficial com as soluções técnicas e comerciais completas!',
                    type: 'document',
                    mediaUrl: 'https://drive.google.com/file/d/1demo-catalogo-verto/view',
                    fileName: 'Catalogo_Oficial_Verto.pdf',
                },
                {
                    shortcut: '/pix',
                    title: 'Dados para Pagamento PIX',
                    content: 'Nossa chave PIX para pagamentos é: cnpj 00.000.000/0001-00',
                    type: 'text',
                },
                {
                    shortcut: '/horario',
                    title: 'Horário de Atendimento',
                    content: 'Nosso horário de atendimento é de segunda a sexta, das 08h às 18h.',
                    type: 'text',
                },
            ];
            for (const d of defaults) {
                try {
                    await this.prisma.quickReply.create({
                        data: {
                            tenantId,
                            shortcut: d.shortcut,
                            title: d.title,
                            content: d.content,
                            type: d.type,
                            mediaUrl: d.mediaUrl || null,
                            mediaDriveId: d.mediaUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(d.mediaUrl) : null,
                            fileName: d.fileName || null,
                        },
                    });
                }
                catch {
                }
            }
            replies = await this.prisma.quickReply.findMany({
                where: { tenantId },
                orderBy: { shortcut: 'asc' },
            });
        }
        const formatReply = (r) => {
            let mediaFiles = [];
            let imageCount = 0;
            let videoCount = 0;
            let docCount = 0;
            if (r.mediaUrl) {
                const trimmed = r.mediaUrl.trim();
                if (trimmed.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            mediaFiles = parsed;
                            imageCount = mediaFiles.filter((m) => m.type === 'image').length;
                            videoCount = mediaFiles.filter((m) => m.type === 'video').length;
                            docCount = mediaFiles.filter((m) => m.type === 'document').length;
                        }
                    }
                    catch {
                    }
                }
                if (mediaFiles.length === 0 && r.type !== 'text') {
                    const type = r.type || 'image';
                    mediaFiles = [{
                            url: r.mediaUrl,
                            driveId: r.mediaDriveId || undefined,
                            type,
                            fileName: r.fileName || 'arquivo',
                        }];
                    if (type === 'image')
                        imageCount = 1;
                    else if (type === 'video')
                        videoCount = 1;
                    else if (type === 'document')
                        docCount = 1;
                }
            }
            return {
                ...r,
                mediaFiles,
                imageCount,
                videoCount,
                docCount,
            };
        };
        return replies.map(formatReply);
    }
    async create(tenantId, data) {
        const rawShortcut = data.shortcut || '';
        const formattedShortcut = rawShortcut.startsWith('/') ? rawShortcut.trim() : `/${rawShortcut.trim()}`;
        let mediaUrl = data.mediaUrl ? data.mediaUrl.trim() : null;
        let mediaDriveId = mediaUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(mediaUrl) : (data.mediaDriveId || null);
        if (Array.isArray(data.mediaFiles) && data.mediaFiles.length > 0) {
            mediaUrl = JSON.stringify(data.mediaFiles);
            mediaDriveId = data.mediaFiles[0].driveId || (data.mediaFiles[0].url ? (0, google_drive_helper_1.extractGoogleDriveId)(data.mediaFiles[0].url) : null);
        }
        let resolvedType = data.type || 'text';
        if (mediaUrl && (!data.type || data.type === 'text')) {
            resolvedType = (0, google_drive_helper_1.detectMediaType)(data.fileName || mediaUrl);
        }
        let fileName = data.fileName ? data.fileName.trim() : null;
        if (mediaUrl && !fileName) {
            const ext = resolvedType === 'document' ? '.pdf' : resolvedType === 'video' ? '.mp4' : '.jpg';
            const cleanTitle = (data.title || 'material').replace(/[^a-zA-Z0-9_-]/g, '_');
            fileName = `${cleanTitle}${ext}`;
        }
        return this.prisma.quickReply.create({
            data: {
                tenantId,
                shortcut: formattedShortcut,
                title: data.title ? data.title.trim() : null,
                content: data.content ? data.content.trim() : (data.title || ''),
                type: resolvedType,
                mediaUrl,
                mediaDriveId,
                fileName,
            },
        });
    }
    async update(tenantId, id, data) {
        const updatePayload = {};
        if (data.shortcut) {
            updatePayload.shortcut = data.shortcut.startsWith('/') ? data.shortcut.trim() : `/${data.shortcut.trim()}`;
        }
        if (data.title !== undefined) {
            updatePayload.title = data.title ? data.title.trim() : null;
        }
        if (data.content !== undefined) {
            updatePayload.content = data.content ? data.content.trim() : '';
        }
        if (data.type !== undefined) {
            updatePayload.type = data.type;
        }
        if (Array.isArray(data.mediaFiles) && data.mediaFiles.length > 0) {
            updatePayload.mediaUrl = JSON.stringify(data.mediaFiles);
            updatePayload.mediaDriveId = data.mediaFiles[0].driveId || (data.mediaFiles[0].url ? (0, google_drive_helper_1.extractGoogleDriveId)(data.mediaFiles[0].url) : null);
            if (data.fileName) {
                updatePayload.fileName = data.fileName.trim();
            }
            else {
                updatePayload.fileName = data.mediaFiles[0].fileName || null;
            }
        }
        else if (data.mediaUrl !== undefined) {
            const mediaUrl = data.mediaUrl ? data.mediaUrl.trim() : null;
            updatePayload.mediaUrl = mediaUrl;
            updatePayload.mediaDriveId = mediaUrl ? (0, google_drive_helper_1.extractGoogleDriveId)(mediaUrl) : null;
        }
        if (data.fileName !== undefined && !Array.isArray(data.mediaFiles)) {
            updatePayload.fileName = data.fileName ? data.fileName.trim() : null;
        }
        return this.prisma.quickReply.update({
            where: { id, tenantId },
            data: updatePayload,
        });
    }
    async delete(tenantId, id) {
        return this.prisma.quickReply.delete({
            where: { id, tenantId },
        });
    }
};
exports.QuickRepliesService = QuickRepliesService;
exports.QuickRepliesService = QuickRepliesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuickRepliesService);
//# sourceMappingURL=quick-replies.service.js.map