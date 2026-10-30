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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var RadarStoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadarStoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const ai_service_1 = require("../../ai/ai.service");
const chat_gateway_1 = require("../../chat/chat.gateway");
const chat_service_1 = require("../../chat/chat.service");
const whatsapp_service_1 = require("../../whatsapp/whatsapp.service");
const storage_service_1 = require("../../../shared/storage/storage.service");
const openai_1 = require("openai");
const axios_1 = require("axios");
const crypto_1 = require("crypto");
let RadarStoriesService = RadarStoriesService_1 = class RadarStoriesService {
    constructor(prisma, aiService, chatGateway, storageService, whatsappService, chatService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.chatGateway = chatGateway;
        this.storageService = storageService;
        this.whatsappService = whatsappService;
        this.chatService = chatService;
        this.logger = new common_1.Logger(RadarStoriesService_1.name);
        this.syncInterval = null;
        this.aiClassificationCache = new Map();
    }
    async onModuleInit() {
        try {
            await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "whatsapp_status_posts" (
          "id" TEXT PRIMARY KEY,
          "tenantId" TEXT NOT NULL,
          "messageId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "mediaUrl" TEXT,
          "postedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
            await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "whatsapp_status_posts" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
        ALTER TABLE "whatsapp_status_posts" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';
        ALTER TABLE "whatsapp_status_views" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';
      `);
            await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "whatsapp_status_views" (
          "id" TEXT PRIMARY KEY,
          "tenantId" TEXT NOT NULL,
          "contactId" TEXT,
          "phone" TEXT NOT NULL,
          "contactName" TEXT,
          "city" TEXT,
          "state" TEXT,
          "statusMessageId" TEXT NOT NULL,
          "storyTitle" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "mediaUrl" TEXT,
          "viewedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
            await this.prisma.$executeRawUnsafe(`
        ALTER TABLE "whatsapp_status_views" ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT;
      `);
        }
        catch (err) {
            this.logger.warn(`Verificacao tabelas status posts/views: ${err.message}`);
        }
        this.startBackgroundSync();
    }
    onModuleDestroy() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    startBackgroundSync() {
        setTimeout(() => {
            this.syncAllActiveTenants().catch((err) => this.logger.warn(`[Radar Stories] Falha no primeiro ciclo de auto-sync: ${err.message}`));
        }, 10000);
        this.syncInterval = setInterval(() => {
            this.syncAllActiveTenants().catch((err) => this.logger.warn(`[Radar Stories] Falha no ciclo de auto-sync: ${err.message}`));
        }, 2 * 60 * 1000);
        this.logger.log(`[Radar Stories] Monitoramento automático em background ativado (polling a cada 2 minutos).`);
    }
    async syncAllActiveTenants() {
        try {
            const instances = await this.prisma.whatsAppInstance.findMany({
                where: { status: { in: ['open', 'connected'] } },
                select: { tenantId: true },
                distinct: ['tenantId'],
            });
            if (!instances || instances.length === 0)
                return;
            for (const inst of instances) {
                if (!inst.tenantId)
                    continue;
                try {
                    const res = await this.syncActiveStories(inst.tenantId);
                    if (res.syncedViewsCount && res.syncedViewsCount > 0) {
                        this.logger.log(`[Radar Stories Auto-Sync] Sincronizadas ${res.syncedViewsCount} novas visualizações para o tenant ${inst.tenantId}`);
                    }
                }
                catch (err) {
                    this.logger.warn(`[Radar Stories Auto-Sync] Erro no tenant ${inst.tenantId}: ${err.message}`);
                }
            }
        }
        catch (err) {
            this.logger.warn(`[Radar Stories Auto-Sync] Erro ao listar instâncias: ${err.message}`);
        }
    }
    async getActivePosts(tenantId, mode = 'active') {
        try {
            const isHistory = mode === 'history' || mode === 'all';
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const timeFilter = isHistory ? new Date(0) : twentyFourHoursAgo;
            const limit = isHistory ? 100 : 50;
            const posts = await this.prisma.$queryRawUnsafe(`SELECT p.*, 
                COUNT(DISTINCT v.phone)::int as "viewsTotal",
                COUNT(DISTINCT v.phone) FILTER (
                  WHERE v."viewedAt" >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo'
                )::int as "viewsToday"
         FROM "whatsapp_status_posts" p
         LEFT JOIN "whatsapp_status_views" v 
           ON (v."tenantId" = p."tenantId" AND (v."statusMessageId" = p."messageId" OR (v."storyTitle" = p."title" AND v."viewedAt" >= p."postedAt")))
         WHERE p."tenantId" = $1 AND p."postedAt" >= $2
         GROUP BY p.id
         ORDER BY p."postedAt" DESC
         LIMIT $3`, tenantId, timeFilter, limit);
            return (posts || []).map((p) => {
                const { dateFormatted, timeFormatted, relative } = this.formatDateTime(p.postedAt);
                let safeMediaUrl = p.mediaUrl;
                if (safeMediaUrl && String(safeMediaUrl).includes('172.16.0.1:3001')) {
                    safeMediaUrl = String(safeMediaUrl).replace('http://172.16.0.1:3001', '/api-backend');
                }
                const viewsTotal = Number(p.viewsTotal) || 0;
                const viewsToday = Number(p.viewsToday) || 0;
                const mediaType = p.mediaType || (String(safeMediaUrl || '').includes('video') || String(safeMediaUrl || '').endsWith('.mp4') ? 'video' : 'image');
                const isLive = new Date(p.postedAt).getTime() >= (Date.now() - 24 * 60 * 60 * 1000);
                return {
                    id: p.id,
                    messageId: p.messageId,
                    title: p.title,
                    category: p.category,
                    mediaUrl: safeMediaUrl,
                    mediaType,
                    thumbnailUrl: p.thumbnailUrl || null,
                    postedAt: p.postedAt,
                    postedAtRelative: relative,
                    postedAtDate: dateFormatted,
                    postedAtTime: timeFormatted,
                    viewsCount: viewsTotal,
                    viewsTotal,
                    viewsToday,
                    isLive,
                };
            });
        }
        catch (err) {
            this.logger.warn(`Erro ao carregar active posts: ${err.message}`);
            return [];
        }
    }
    async getRecentViewersPhones(tenantId) {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const rows = await this.prisma.$queryRawUnsafe(`SELECT DISTINCT "phone" 
         FROM "whatsapp_status_views" 
         WHERE "tenantId" = $1 AND "viewedAt" >= $2`, tenantId, twentyFourHoursAgo);
            const phones = (rows || []).map((r) => r.phone).filter(Boolean);
            return { phones };
        }
        catch (err) {
            this.logger.warn(`Erro ao obter telefones de visualizadores recentes: ${err.message}`);
            return { phones: [] };
        }
    }
    async getContactLatestView(tenantId, phone, contactId) {
        try {
            const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const rows = await this.prisma.$queryRawUnsafe(`SELECT v.*, p."mediaUrl" as "postMediaUrl"
         FROM "whatsapp_status_views" v
         LEFT JOIN "whatsapp_status_posts" p 
           ON (p."tenantId" = v."tenantId" AND (p."messageId" = v."statusMessageId" OR p."title" = v."storyTitle"))
         WHERE v."tenantId" = $1 
           AND (v."phone" = $2 OR v."phone" LIKE $3 OR (v."contactId" = $4 AND $4 IS NOT NULL))
           AND v."viewedAt" >= $5
         ORDER BY v."viewedAt" DESC
         LIMIT 1`, tenantId, cleanPhone, `%${cleanPhone.slice(-8)}`, contactId || null, twentyFourHoursAgo);
            if (!rows || rows.length === 0)
                return null;
            const row = rows[0];
            const { dateFormatted, timeFormatted, relative } = this.formatDateTime(row.viewedAt);
            return {
                id: row.id,
                statusMessageId: row.statusMessageId,
                title: row.storyTitle,
                category: row.category,
                mediaUrl: row.postMediaUrl || row.mediaUrl || undefined,
                viewedAt: row.viewedAt,
                exactDate: dateFormatted,
                exactTime: timeFormatted,
                relative,
            };
        }
        catch (err) {
            this.logger.warn(`Erro ao buscar ultima visualizacao do contato: ${err.message}`);
            return null;
        }
    }
    async publishStory(tenantId, data) {
        const rawMedia = data.mediaBase64 || data.videoBase64 || data.imageBase64;
        if (!data.title || !rawMedia) {
            throw new common_1.BadRequestException('Título/Legenda e arquivo de mídia (imagem ou vídeo) são obrigatórios para publicar o Story.');
        }
        const isVideo = data.mediaType === 'video' || rawMedia.startsWith('data:video') || rawMedia.includes('.mp4');
        const mediaType = isVideo ? 'video' : 'image';
        const postId = `story_${Date.now()}_${(0, crypto_1.randomUUID)().substring(0, 6)}`;
        const category = data.category || 'Geral';
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, status: { in: ['open', 'connected'] } },
            orderBy: { isDefault: 'desc' },
        });
        const serverUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const apiKey = process.env.EVOLUTION_API_KEY || 'verto123';
        const cleanTenant = (tenantId || 'tenant').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        let instanceName = instance?.settings?.instanceName;
        if (!instanceName && instance?.name && instance.name.includes('_')) {
            instanceName = instance.name.replace(' (WhatsApp Web)', '').trim();
        }
        if (!instanceName) {
            instanceName = `versus_${cleanTenant}_babdc262eb`;
        }
        let whatsappMessageId = `story_msg_${Date.now()}`;
        let evolutionMediaContent = rawMedia;
        let browserMediaUrl = rawMedia.startsWith('data:')
            ? rawMedia
            : rawMedia.startsWith('http')
                ? rawMedia
                : `data:${isVideo ? 'video/mp4' : 'image/jpeg'};base64,${rawMedia}`;
        if (this.storageService && rawMedia) {
            try {
                const matches = rawMedia.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                let buffer;
                let mimetype = isVideo ? 'video/mp4' : 'image/jpeg';
                if (matches && matches.length === 3) {
                    mimetype = matches[1];
                    buffer = Buffer.from(matches[2], 'base64');
                }
                else {
                    buffer = Buffer.from(rawMedia, 'base64');
                }
                const ext = isVideo ? 'mp4' : 'jpg';
                const uploadRes = await this.storageService.uploadFile({ buffer, originalname: `story_${Date.now()}.${ext}`, mimetype }, 'stories');
                if (uploadRes?.url) {
                    if (uploadRes.url.startsWith('https://')) {
                        evolutionMediaContent = uploadRes.url;
                        browserMediaUrl = uploadRes.url;
                    }
                    else if (uploadRes.url.startsWith('http://')) {
                        evolutionMediaContent = uploadRes.url;
                    }
                    else {
                        evolutionMediaContent = `http://172.16.0.1:3001${uploadRes.url.replace('/api-backend', '')}`;
                    }
                }
            }
            catch (uploadErr) {
                this.logger.warn(`[Radar Stories] Aviso no upload da mídia do Story: ${uploadErr.message}`);
            }
        }
        if (!data.scheduledAt) {
            try {
                const headers = { apikey: apiKey, 'Content-Type': 'application/json' };
                const addNormalizedBrJids = (rawPhone, targetSet) => {
                    let digits = String(rawPhone || '').replace(/@.*$/, '').replace(/\D/g, '');
                    if (!digits || digits.length < 10 || digits.length > 13)
                        return;
                    if (digits.length === 10 || digits.length === 11) {
                        digits = `55${digits}`;
                    }
                    if (!digits.startsWith('55'))
                        return;
                    targetSet.add(`${digits}@s.whatsapp.net`);
                    if (digits.length === 13 && digits[4] === '9') {
                        const withoutNine = digits.slice(0, 4) + digits.slice(5);
                        targetSet.add(`${withoutNine}@s.whatsapp.net`);
                    }
                    else if (digits.length === 12) {
                        const withNine = digits.slice(0, 4) + '9' + digits.slice(4);
                        targetSet.add(`${withNine}@s.whatsapp.net`);
                    }
                };
                const jidSet = new Set();
                addNormalizedBrJids(String(instance?.phoneNumber || ''), jidSet);
                addNormalizedBrJids('555499112550', jidSet);
                addNormalizedBrJids('555496283090', jidSet);
                addNormalizedBrJids('5554991109159', jidSet);
                try {
                    const evoContactsRes = await axios_1.default.post(`${serverUrl}/chat/findContacts/${instanceName}`, { where: {} }, { headers, timeout: 6000 });
                    if (Array.isArray(evoContactsRes.data)) {
                        for (const ec of evoContactsRes.data) {
                            const jid = String(ec?.id || '');
                            if (jid.endsWith('@s.whatsapp.net')) {
                                addNormalizedBrJids(jid, jidSet);
                            }
                        }
                    }
                }
                catch { }
                const recentContacts = await this.prisma.contact.findMany({
                    where: {
                        tenantId,
                        conversations: { some: {} },
                    },
                    orderBy: { updatedAt: 'desc' },
                    take: 120,
                    select: { phone: true },
                });
                for (const c of recentContacts) {
                    addNormalizedBrJids(String(c.phone || ''), jidSet);
                }
                const statusJidList = Array.from(jidSet);
                try {
                    const statusRes = await axios_1.default.post(`${serverUrl}/message/sendStatus/${instanceName}`, {
                        statusMessage: {
                            type: mediaType,
                            content: evolutionMediaContent,
                            caption: data.title,
                            allContacts: false,
                            statusJidList,
                        },
                    }, { headers, timeout: 35000 });
                    if (statusRes.data?.key?.id) {
                        whatsappMessageId = statusRes.data.key.id;
                        this.logger.log(`[Radar Stories] Story (${mediaType}) publicado no WhatsApp via Evolution API! MsgID: ${whatsappMessageId}`);
                    }
                }
                catch (firstErr) {
                    const coreJids = [
                        '555499112550@s.whatsapp.net',
                        '555496283090@s.whatsapp.net',
                        '555491109159@s.whatsapp.net',
                        '555496313003@s.whatsapp.net',
                        '555496389633@s.whatsapp.net',
                    ];
                    const retryRes = await axios_1.default.post(`${serverUrl}/message/sendStatus/${instanceName}`, {
                        statusMessage: {
                            type: mediaType,
                            content: evolutionMediaContent,
                            caption: data.title,
                            allContacts: false,
                            statusJidList: Array.from(new Set(coreJids)),
                        },
                    }, { headers, timeout: 35000 });
                    if (retryRes.data?.key?.id) {
                        whatsappMessageId = retryRes.data.key.id;
                        this.logger.log(`[Radar Stories] Story (${mediaType}) publicado no WhatsApp (retry core sessions)! MsgID: ${whatsappMessageId}`);
                    }
                }
            }
            catch (evoErr) {
                this.logger.error(`[Radar Stories] Erro ao disparar Story na Evolution API: ${evoErr.response?.data?.message || evoErr.message}`);
            }
        }
        await this.prisma.$executeRawUnsafe(`INSERT INTO "whatsapp_status_posts" 
       ("id", "tenantId", "messageId", "title", "category", "mediaUrl", "mediaType", "postedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, postId, tenantId, whatsappMessageId, data.title, category, browserMediaUrl, mediaType, data.scheduledAt ? new Date(data.scheduledAt) : new Date());
        this.logger.log(`[Radar Stories] Novo Story registrado: "${data.title}" [${category}] [${mediaType}] (ID: ${postId})`);
        if (this.chatGateway) {
            this.chatGateway.emitStoryPosted(tenantId, {
                messageId: whatsappMessageId,
                title: data.title,
                category,
                mediaUrl: browserMediaUrl,
                mediaType,
            });
        }
        return {
            success: true,
            postId,
            messageId: whatsappMessageId,
            title: data.title,
            category,
            mediaUrl: browserMediaUrl,
            postedImmediately: !data.scheduledAt,
            scheduledAt: data.scheduledAt || null,
        };
    }
    async syncActiveStories(tenantId) {
        this.logger.log(`[Radar Stories] Iniciando sincronização ativa para tenant: ${tenantId}`);
        const serverUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const apiKey = process.env.EVOLUTION_API_KEY || 'verto123';
        const headers = { apikey: apiKey, 'Content-Type': 'application/json' };
        const instances = await this.prisma.whatsAppInstance.findMany({
            where: { tenantId },
            orderBy: { updatedAt: 'desc' },
        });
        const activeInstance = instances.find((i) => i.status === 'open' || i.status === 'connected') || instances[0];
        const cleanTenant = (tenantId || 'tenant').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        let instanceName = activeInstance?.settings?.instanceName;
        if (!instanceName && activeInstance?.name && activeInstance.name.includes('_')) {
            instanceName = activeInstance.name.replace(' (WhatsApp Web)', '').trim();
        }
        if (!instanceName && this.whatsappService) {
            instanceName = await this.whatsappService.getEvolutionInstanceName(tenantId);
        }
        if (!instanceName) {
            instanceName = `versus_${cleanTenant}_babdc262eb`;
        }
        try {
            await axios_1.default.post(`${serverUrl}/settings/set/${instanceName}`, {
                reject_call: false,
                msg_call: '',
                groups_ignore: true,
                always_online: false,
                read_messages: false,
                read_status: true,
                sync_full_history: false,
            }, { headers, timeout: 5000 });
        }
        catch (e) {
            this.logger.warn(`[Sync Stories] Aviso ao configurar read_status: ${e.message}`);
        }
        try {
            const webhookUrl = `http://172.16.0.1:3001/webhooks/evolution/${tenantId}`;
            await axios_1.default.post(`${serverUrl}/webhook/set/${instanceName}`, {
                enabled: true,
                url: webhookUrl,
                webhook_by_events: false,
                webhook_base64: true,
                events: [
                    'CONNECTION_UPDATE',
                    'QRCODE_UPDATED',
                    'MESSAGES_SET',
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE',
                    'SEND_MESSAGE',
                    'CONTACTS_UPSERT',
                    'CHATS_UPSERT',
                ],
            }, { headers, timeout: 5000 });
        }
        catch (e) {
            this.logger.warn(`[Sync Stories] Aviso ao configurar webhook: ${e.message}`);
        }
        let syncedViewsCount = 0;
        try {
            const reconciled = await this.reconcileExistingLidViewers(tenantId, instanceName);
            syncedViewsCount += reconciled;
        }
        catch (e) {
            this.logger.warn(`[Sync Stories] Aviso na reconciliação retroativa de LIDs: ${e.message}`);
        }
        try {
            const statusRes = await axios_1.default.post(`${serverUrl}/chat/findStatusMessage/${instanceName}`, {}, { headers, timeout: 10000 });
            const rawItems = Array.isArray(statusRes.data) ? statusRes.data : [];
            if (rawItems.length > 0) {
                const posts = await this.prisma.$queryRawUnsafe(`SELECT * FROM "whatsapp_status_posts"
           WHERE "tenantId" = $1
           ORDER BY "postedAt" DESC
           LIMIT 30`, tenantId);
                const postByMsgId = new Map();
                for (const p of posts || []) {
                    if (p.messageId)
                        postByMsgId.set(String(p.messageId), p);
                }
                const sevenDaysAgoMs = Date.now() - 7 * 24 * 3600 * 1000;
                for (const item of rawItems) {
                    if (!item.fromMe)
                        continue;
                    if (item.status !== 'READ' && item.status !== 'PLAYED')
                        continue;
                    const rawJid = String(item.remoteJid || item.participant || '');
                    if (!rawJid)
                        continue;
                    const dtMs = item.datetime > 10000000000 ? Number(item.datetime) : Number(item.datetime) * 1000;
                    if (!dtMs || dtMs < sevenDaysAgoMs)
                        continue;
                    const itemMsgId = String(item.id || item.keyId || item.key?.id || '');
                    const matchedPost = postByMsgId.get(itemMsgId);
                    if (!matchedPost)
                        continue;
                    const viewerJid = rawJid.includes('status@broadcast') ? String(item.participant || '') : rawJid;
                    if (!viewerJid || viewerJid.includes('status@broadcast'))
                        continue;
                    const lidKey = viewerJid.split(':')[0].replace('@lid', '').replace('@s.whatsapp.net', '').replace(/\D/g, '');
                    if (lidKey.length < 8)
                        continue;
                    const exists = await this.prisma.$queryRawUnsafe(`SELECT id FROM "whatsapp_status_views"
             WHERE "tenantId" = $1
               AND ("phone" LIKE $2 OR "phone" = $3)
               AND "statusMessageId" = $4
             LIMIT 1`, tenantId, `%${lidKey.slice(-10)}%`, viewerJid, matchedPost.messageId);
                    if (exists && exists.length > 0)
                        continue;
                    const resolved = await this.resolveViewerIdentity(tenantId, instanceName, viewerJid);
                    const viewId = `view_sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                    const inserted = await this.prisma.$executeRawUnsafe(`INSERT INTO "whatsapp_status_views"
             ("id", "tenantId", "contactId", "phone", "contactName", "city", "state", "statusMessageId", "storyTitle", "category", "mediaUrl", "viewedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT ("tenantId", "statusMessageId", "phone") DO NOTHING`, viewId, tenantId, resolved.contactId, resolved.phone, resolved.name, resolved.city, resolved.state, matchedPost.messageId, matchedPost.title, matchedPost.category, matchedPost.mediaUrl, new Date(dtMs));
                    if (inserted > 0) {
                        syncedViewsCount++;
                    }
                }
            }
        }
        catch (e) {
            this.logger.debug(`[Sync Stories] Leitura findStatusMessage concluída: ${e.message}`);
        }
        const activePosts = await this.getActivePosts(tenantId);
        return {
            success: true,
            message: syncedViewsCount > 0
                ? `Sincronização concluída! ${syncedViewsCount} visualizações/contatos reconciliados com sucesso.`
                : 'Stories, fotos e visualizações do WhatsApp sincronizados com sucesso!',
            activePosts,
            syncedViewsCount,
        };
    }
    async resolveViewerIdentity(tenantId, instanceName, rawParticipant, hintName) {
        const cleanDigits = String(rawParticipant)
            .split(':')[0]
            .replace('@s.whatsapp.net', '')
            .replace('@c.us', '')
            .replace('@lid', '')
            .replace(/\D/g, '');
        let realPhone = cleanDigits;
        let realName = hintName && hintName !== 'Comercial Verto' && !hintName.startsWith('Produtor Rural') ? hintName : '';
        let contactId = null;
        let city = '';
        const state = '';
        const dbContact = await this.prisma.contact.findFirst({
            where: {
                tenantId,
                OR: [
                    { phone: realPhone },
                    ...(realPhone.length >= 10 && realPhone.length <= 13 ? [{ phone: { endsWith: realPhone.slice(-8) } }] : []),
                    { whatsappLid: { contains: cleanDigits } },
                    { phone: { contains: cleanDigits } },
                    ...(realName ? [{ name: { equals: realName, mode: 'insensitive' } }] : []),
                ],
            },
        });
        if (dbContact) {
            contactId = dbContact.id;
            const dbDigits = (dbContact.phone || '').replace(/\D/g, '');
            if (dbDigits.length >= 10 && dbDigits.length <= 13 && !dbContact.phone?.includes('@lid')) {
                realPhone = dbDigits;
            }
            if (dbContact.name && dbContact.name !== 'Comercial Verto' && !dbContact.name.startsWith('Produtor Rural')) {
                realName = dbContact.name;
            }
            if (dbContact.address) {
                city = dbContact.address;
            }
        }
        if ((realPhone.length > 13 || !realName) && this.whatsappService) {
            try {
                const evoRes = await this.whatsappService.resolveContactFromEvolution(tenantId, instanceName, rawParticipant.includes('@') ? rawParticipant : `${cleanDigits}@lid`, realName || undefined);
                if (evoRes?.realPhone && evoRes.realPhone.length >= 10 && evoRes.realPhone.length <= 13) {
                    realPhone = evoRes.realPhone;
                }
                if (evoRes?.realName && evoRes.realName !== 'Comercial Verto' && !realName) {
                    realName = evoRes.realName;
                }
                if (realPhone.length >= 10 && realPhone.length <= 13 && !contactId) {
                    const matchedByRealPhone = await this.prisma.contact.findFirst({
                        where: {
                            tenantId,
                            OR: [{ phone: realPhone }, { phone: { endsWith: realPhone.slice(-8) } }],
                        },
                    });
                    if (matchedByRealPhone) {
                        contactId = matchedByRealPhone.id;
                        realName = realName || matchedByRealPhone.name;
                        city = matchedByRealPhone.address || city;
                        if (!matchedByRealPhone.whatsappLid && cleanDigits.length > 13) {
                            await this.prisma.contact
                                .update({
                                where: { id: matchedByRealPhone.id },
                                data: { whatsappLid: `${cleanDigits}@lid` },
                            })
                                .catch(() => { });
                        }
                    }
                }
            }
            catch { }
        }
        if (!realName) {
            realName =
                realPhone.length >= 10 && realPhone.length <= 13
                    ? `Contato WhatsApp (${realPhone.slice(-4)})`
                    : `Produtor Rural (${cleanDigits.slice(-4)})`;
        }
        if (!contactId && realPhone.length >= 10 && realPhone.length <= 13) {
            try {
                const autoName = realName && !realName.startsWith('Contato WhatsApp') && !realName.startsWith('Produtor Rural')
                    ? realName
                    : `Lead Story (${realPhone.slice(-4)})`;
                const newLead = await this.prisma.contact.upsert({
                    where: {
                        tenantId_phone: {
                            tenantId,
                            phone: realPhone,
                        },
                    },
                    update: {
                        ...(cleanDigits.length > 13 ? { whatsappLid: `${cleanDigits}@lid` } : {}),
                    },
                    create: {
                        tenantId,
                        name: autoName,
                        phone: realPhone,
                        source: 'Radar Stories (WhatsApp Status)',
                        tags: ['Lead Story', 'Impulsionamento WhatsApp'],
                        whatsappLid: cleanDigits.length > 13 ? `${cleanDigits}@lid` : undefined,
                        address: city || undefined,
                    },
                });
                contactId = newLead.id;
                if (!realName || realName.startsWith('Contato WhatsApp') || realName.startsWith('Produtor Rural')) {
                    realName = newLead.name;
                }
                this.logger.log(`[Radar Stories] Novo Lead registrado automaticamente via Story: ${realName} (${realPhone})`);
            }
            catch (upsertErr) {
                const existing = await this.prisma.contact.findFirst({
                    where: { tenantId, phone: realPhone },
                    select: { id: true, name: true },
                });
                if (existing) {
                    contactId = existing.id;
                    if (existing.name)
                        realName = existing.name;
                }
            }
        }
        return {
            contactId,
            phone: realPhone,
            name: realName,
            city,
            state,
        };
    }
    async reconcileExistingLidViewers(tenantId, instanceName) {
        const unresolvedRows = await this.prisma.$queryRawUnsafe(`SELECT id, "contactId", phone, "contactName"
       FROM "whatsapp_status_views"
       WHERE "tenantId" = $1
         AND (
           LENGTH(REGEXP_REPLACE(phone, '[^0-9]', '', 'g')) > 13
           OR phone LIKE '%@lid%'
           OR "contactName" LIKE 'Produtor Rural%'
           OR "contactName" = 'Comercial Verto'
           OR "contactId" IS NULL
         )
       ORDER BY "viewedAt" DESC
       LIMIT 100`, tenantId);
        if (!unresolvedRows || unresolvedRows.length === 0)
            return 0;
        const targetInst = instanceName || (this.whatsappService ? await this.whatsappService.getEvolutionInstanceName(tenantId) : '');
        let updatedCount = 0;
        for (const row of unresolvedRows) {
            const resolved = await this.resolveViewerIdentity(tenantId, targetInst, row.phone, row.contactName);
            const changedPhone = resolved.phone !== row.phone && resolved.phone.length >= 10 && resolved.phone.length <= 13;
            const changedName = resolved.name &&
                resolved.name !== row.contactName &&
                !resolved.name.startsWith('Produtor Rural');
            const changedContactId = resolved.contactId && resolved.contactId !== row.contactId;
            if (changedPhone || changedName || changedContactId) {
                await this.prisma.$executeRawUnsafe(`UPDATE "whatsapp_status_views"
           SET "phone" = $1,
               "contactName" = $2,
               "contactId" = COALESCE($3, "contactId")
           WHERE "id" = $4`, resolved.phone, resolved.name, resolved.contactId, row.id);
                updatedCount++;
            }
        }
        return updatedCount;
    }
    formatDateTime(date) {
        const d = new Date(date);
        const nowSpStr = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date());
        const targetSpStr = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(d);
        const timeFormatted = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(d);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdaySpStr = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(yesterday);
        const diffMinutes = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
        const timeShort = timeFormatted.slice(0, 5);
        let relative = 'Agora';
        if (diffMinutes < 1) {
            relative = 'Agora mesmo';
        }
        else if (diffMinutes < 60 && nowSpStr === targetSpStr) {
            relative = `Há ${diffMinutes} min`;
        }
        else if (nowSpStr === targetSpStr) {
            relative = `Hoje às ${timeShort}`;
        }
        else if (yesterdaySpStr === targetSpStr) {
            relative = `Ontem às ${timeShort}`;
        }
        else {
            relative = `${targetSpStr.slice(0, 5)} às ${timeShort}`;
        }
        return { dateFormatted: targetSpStr, timeFormatted, relative };
    }
    formatBrazilianPhone(phone) {
        if (!phone)
            return { formatted: 'Sem Telefone', isLidOnly: false, cleanDigits: '' };
        const raw = String(phone).trim();
        const isLid = raw.includes('@lid') || (raw.replace(/\D/g, '').length > 13 && !raw.startsWith('55'));
        const clean = raw.replace(/\D/g, '');
        if (isLid && clean.length > 13) {
            return {
                formatted: `ID WhatsApp (${clean.slice(-4)})`,
                isLidOnly: true,
                cleanDigits: clean,
            };
        }
        let digits = clean;
        if (digits.startsWith('55') && digits.length >= 12) {
            digits = digits.substring(2);
        }
        if (digits.length === 11) {
            return {
                formatted: `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`,
                isLidOnly: false,
                cleanDigits: clean.startsWith('55') ? clean : `55${clean}`,
            };
        }
        else if (digits.length === 10) {
            return {
                formatted: `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`,
                isLidOnly: false,
                cleanDigits: clean.startsWith('55') ? clean : `55${clean}`,
            };
        }
        return {
            formatted: digits.length >= 8 ? `+55 ${digits}` : raw,
            isLidOnly: isLid,
            cleanDigits: clean,
        };
    }
    resolveCityAndState(phone, contactAddress, viewCity, viewState, contextText) {
        if (contactAddress && contactAddress.trim().length > 2 && contactAddress !== 'Região Sul') {
            const parts = contactAddress.split(/[-/,]/).map((s) => s.trim()).filter(Boolean);
            const st = parts.find((p) => p.length === 2 && /^[A-Z]{2}$/i.test(p))?.toUpperCase() || viewState || 'RS';
            const ct = parts[0] || contactAddress.trim();
            return { city: ct, state: st };
        }
        const fullText = `${contextText || ''} ${viewCity || ''}`.toLowerCase();
        if (fullText.includes('eulina braga') || fullText.includes('passo fundo')) {
            return { city: 'Passo Fundo', state: 'RS' };
        }
        const knownCities = [
            { match: 'marau', city: 'Marau', state: 'RS' },
            { match: 'carazinho', city: 'Carazinho', state: 'RS' },
            { match: 'erechim', city: 'Erechim', state: 'RS' },
            { match: 'tapejara', city: 'Tapejara', state: 'RS' },
            { match: 'lagoa vermelha', city: 'Lagoa Vermelha', state: 'RS' },
            { match: 'vacaria', city: 'Vacaria', state: 'RS' },
            { match: 'caxias do sul', city: 'Caxias do Sul', state: 'RS' },
            { match: 'bento gonçalves', city: 'Bento Gonçalves', state: 'RS' },
            { match: 'bento goncalves', city: 'Bento Gonçalves', state: 'RS' },
            { match: 'não-me-toque', city: 'Não-Me-Toque', state: 'RS' },
            { match: 'nao-me-toque', city: 'Não-Me-Toque', state: 'RS' },
            { match: 'nao me toque', city: 'Não-Me-Toque', state: 'RS' },
            { match: 'ibirubá', city: 'Ibirubá', state: 'RS' },
            { match: 'ibiruba', city: 'Ibirubá', state: 'RS' },
            { match: 'soledade', city: 'Soledade', state: 'RS' },
            { match: 'sarandi', city: 'Sarandi', state: 'RS' },
            { match: 'getúlio vargas', city: 'Getúlio Vargas', state: 'RS' },
            { match: 'getulio vargas', city: 'Getúlio Vargas', state: 'RS' },
            { match: 'sertão', city: 'Sertão', state: 'RS' },
            { match: 'coxilha', city: 'Coxilha', state: 'RS' },
            { match: 'pontão', city: 'Pontão', state: 'RS' },
            { match: 'casca', city: 'Casca', state: 'RS' },
            { match: 'guaporé', city: 'Guaporé', state: 'RS' },
            { match: 'serafina corrêa', city: 'Serafina Corrêa', state: 'RS' },
            { match: 'sananduva', city: 'Sananduva', state: 'RS' },
            { match: 'nova prata', city: 'Nova Prata', state: 'RS' },
            { match: 'cruz alta', city: 'Cruz Alta', state: 'RS' },
            { match: 'ijuí', city: 'Ijuí', state: 'RS' },
            { match: 'ijui', city: 'Ijuí', state: 'RS' },
            { match: 'santo ângelo', city: 'Santo Ângelo', state: 'RS' },
            { match: 'santa rosa', city: 'Santa Rosa', state: 'RS' },
            { match: 'palmeira das missões', city: 'Palmeira das Missões', state: 'RS' },
            { match: 'santa maria', city: 'Santa Maria', state: 'RS' },
            { match: 'pelotas', city: 'Pelotas', state: 'RS' },
            { match: 'porto alegre', city: 'Porto Alegre', state: 'RS' },
            { match: 'chapecó', city: 'Chapecó', state: 'SC' },
            { match: 'chapeco', city: 'Chapecó', state: 'SC' },
            { match: 'pato branco', city: 'Pato Branco', state: 'PR' },
            { match: 'cascavel', city: 'Cascavel', state: 'PR' },
            { match: 'toledo', city: 'Toledo', state: 'PR' },
            { match: 'maringá', city: 'Maringá', state: 'PR' },
            { match: 'londrina', city: 'Londrina', state: 'PR' },
            { match: 'ponta grossa', city: 'Ponta Grossa', state: 'PR' },
            { match: 'sorriso', city: 'Sorriso', state: 'MT' },
            { match: 'sinop', city: 'Sinop', state: 'MT' },
            { match: 'lucas do rio verde', city: 'Lucas do Rio Verde', state: 'MT' },
            { match: 'rondonópolis', city: 'Rondonópolis', state: 'MT' },
            { match: 'rio verde', city: 'Rio Verde', state: 'GO' },
            { match: 'jataí', city: 'Jataí', state: 'GO' },
            { match: 'dourados', city: 'Dourados', state: 'MS' },
            { match: 'luís eduardo magalhães', city: 'Luís Eduardo Magalhães', state: 'BA' },
            { match: 'barreiras', city: 'Barreiras', state: 'BA' },
        ];
        for (const item of knownCities) {
            if (fullText.includes(item.match)) {
                return { city: item.city, state: item.state };
            }
        }
        let clean = String(phone || '').replace(/\D/g, '');
        if (clean.startsWith('55') && clean.length >= 12) {
            clean = clean.slice(2);
        }
        const ddd = clean.length >= 10 ? clean.slice(0, 2) : '';
        const subscriber = clean.length === 11 ? clean.slice(3) : clean.length === 10 ? clean.slice(2) : '';
        const prefix4 = subscriber.slice(0, 4);
        if (ddd === '54') {
            const passoFundoPrefixes = new Set([
                '9910', '9911', '9912', '9913', '9914', '9915', '9916',
                '9923', '9924', '9925', '9928', '9960', '9961', '9962', '9963', '9964', '9965',
                '9990', '9995', '9996', '9997', '9998', '9999',
                '9110', '9112', '9115', '9235', '9620', '9628', '9631', '9638', '9928',
                '3311', '3312', '3313', '3314', '3315', '3316', '3317',
            ]);
            const carazinhoPrefixes = new Set(['3329', '3330', '3331', '3332']);
            const marauPrefixes = new Set(['3342', '3343']);
            const erechimPrefixes = new Set(['3519', '3520', '3521', '3522']);
            const caxiasPrefixes = new Set([
                '3211', '3212', '3213', '3214', '3215', '3217', '3218', '3219',
                '3220', '3221', '3222', '3223', '3224', '3225', '3226', '3227', '3228', '3229',
                '9917', '9918', '9919', '9117', '9118', '9119',
            ]);
            if (passoFundoPrefixes.has(prefix4))
                return { city: 'Passo Fundo', state: 'RS' };
            if (carazinhoPrefixes.has(prefix4))
                return { city: 'Carazinho', state: 'RS' };
            if (marauPrefixes.has(prefix4))
                return { city: 'Marau', state: 'RS' };
            if (erechimPrefixes.has(prefix4))
                return { city: 'Erechim', state: 'RS' };
            if (caxiasPrefixes.has(prefix4))
                return { city: 'Caxias do Sul', state: 'RS' };
            return { city: 'Passo Fundo / Região', state: 'RS' };
        }
        const dddMap = {
            '51': { city: 'Porto Alegre / Região', state: 'RS' },
            '53': { city: 'Pelotas / Sul', state: 'RS' },
            '55': { city: 'Santa Maria / Missões', state: 'RS' },
            '47': { city: 'Joinville / Vale do Itajaí', state: 'SC' },
            '48': { city: 'Florianópolis / Sul', state: 'SC' },
            '49': { city: 'Chapecó / Oeste', state: 'SC' },
            '41': { city: 'Curitiba / Região', state: 'PR' },
            '42': { city: 'Ponta Grossa / Campos Gerais', state: 'PR' },
            '43': { city: 'Londrina / Norte', state: 'PR' },
            '44': { city: 'Maringá / Campo Mourão', state: 'PR' },
            '45': { city: 'Cascavel / Toledo', state: 'PR' },
            '46': { city: 'Pato Branco / Sudoeste', state: 'PR' },
            '11': { city: 'São Paulo', state: 'SP' },
            '14': { city: 'Bauru / Marília', state: 'SP' },
            '15': { city: 'Sorocaba / Itapetininga', state: 'SP' },
            '16': { city: 'Ribeirão Preto', state: 'SP' },
            '17': { city: 'São José do Rio Preto', state: 'SP' },
            '18': { city: 'Presidente Prudente / Assis', state: 'SP' },
            '19': { city: 'Campinas / Piracicaba', state: 'SP' },
            '31': { city: 'Belo Horizonte', state: 'MG' },
            '34': { city: 'Uberlândia / Triângulo', state: 'MG' },
            '35': { city: 'Poços de Caldas / Sul', state: 'MG' },
            '37': { city: 'Divinópolis / Centro-Oeste', state: 'MG' },
            '38': { city: 'Montes Claros / Unaí', state: 'MG' },
            '61': { city: 'Brasília / Cristalina', state: 'DF' },
            '62': { city: 'Goiânia / Anápolis', state: 'GO' },
            '64': { city: 'Rio Verde / Jataí', state: 'GO' },
            '65': { city: 'Cuiabá / Médio-Norte', state: 'MT' },
            '66': { city: 'Sorriso / Sinop / Rondonópolis', state: 'MT' },
            '67': { city: 'Dourados / Campo Grande', state: 'MS' },
            '63': { city: 'Palmas / Gurupi', state: 'TO' },
            '77': { city: 'Luís Eduardo Magalhães / Barreiras', state: 'BA' },
            '89': { city: 'Uruçuí / Bom Jesus', state: 'PI' },
            '99': { city: 'Balsas / Imperatriz', state: 'MA' },
            '91': { city: 'Belém / Paragominas', state: 'PA' },
            '93': { city: 'Santarém / BR-163', state: 'PA' },
            '94': { city: 'Marabá / Redenção', state: 'PA' },
            '69': { city: 'Vilhena / Porto Velho', state: 'RO' },
        };
        if (ddd && dddMap[ddd]) {
            return dddMap[ddd];
        }
        return {
            city: viewCity && viewCity !== 'Região Sul' ? viewCity : 'Passo Fundo',
            state: viewState || 'RS',
        };
    }
    async getMetrics(tenantId) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [contactsCount, hotOpportunities, todayRes, weekRes, reheatedRes, dailyCatRows, catRows,] = await Promise.all([
            this.prisma.contact.count({ where: { tenantId } }).catch(() => 0),
            this.prisma.deal
                .count({
                where: {
                    tenantId,
                    status: { in: ['lead', 'contacted', 'proposal', 'negotiation', 'follow-up'] },
                },
            })
                .catch(() => 0),
            this.prisma
                .$queryRawUnsafe(`SELECT count(DISTINCT phone)::int as count 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 
             AND "viewedAt" >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo'`, tenantId)
                .catch(() => [{ count: 0 }]),
            this.prisma
                .$queryRawUnsafe(`SELECT count(DISTINCT phone)::int as count 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 
             AND "viewedAt" >= NOW() - INTERVAL '7 days'`, tenantId)
                .catch(() => [{ count: 0 }]),
            this.prisma
                .$queryRawUnsafe(`SELECT count(DISTINCT v."phone")::int as count 
           FROM "whatsapp_status_views" v
           WHERE v."tenantId" = $1 AND v."viewedAt" >= $2`, tenantId, sevenDaysAgo)
                .catch(() => [{ count: 0 }]),
            this.prisma
                .$queryRawUnsafe(`SELECT TO_CHAR("viewedAt" AT TIME ZONE 'America/Sao_Paulo', 'DD/MM') as day_str,
                  category,
                  count(*)::int as c
           FROM "whatsapp_status_views"
           WHERE "tenantId" = $1 AND "viewedAt" >= $2
           GROUP BY day_str, category`, tenantId, sevenDaysAgo)
                .catch(() => []),
            this.prisma
                .$queryRawUnsafe(`SELECT category, count(*)::int as count 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 
           GROUP BY category`, tenantId)
                .catch(() => []),
        ]);
        const totalViewsToday = todayRes?.[0]?.count || 0;
        const totalViewsWeek = weekRes?.[0]?.count || 0;
        const inactiveReheated = reheatedRes?.[0]?.count || 0;
        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const chartDays = [];
        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            const dayName = i === 0 ? 'Hoje' : dayLabels[targetDate.getDay()];
            const dayFormatted = new Intl.DateTimeFormat('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                day: '2-digit',
                month: '2-digit',
            }).format(targetDate);
            let dayCount = 0;
            let maqCount = 0;
            let insCount = 0;
            let cotCount = 0;
            let pecCount = 0;
            for (const row of dailyCatRows || []) {
                if (row.day_str === dayFormatted) {
                    const cat = (row.category || '').toLowerCase();
                    const cnt = Number(row.c) || 0;
                    dayCount += cnt;
                    if (cat.includes('maq'))
                        maqCount += cnt;
                    else if (cat.includes('ins'))
                        insCount += cnt;
                    else if (cat.includes('cot') || cat.includes('safra'))
                        cotCount += cnt;
                    else
                        pecCount += cnt;
                }
            }
            chartDays.push({
                date: `${dayName} (${dayFormatted})`,
                Maquinarios: maqCount,
                Insumos: insCount,
                Cotacoes: cotCount,
                Pecas: pecCount,
                total: dayCount,
            });
        }
        let categoryDistribution = [
            { name: 'Maquinários & Implementos', value: 0, percentage: 0 },
            { name: 'Insumos & Defensivos', value: 0, percentage: 0 },
            { name: 'Cotações de Safra & Grãos', value: 0, percentage: 0 },
            { name: 'Peças & Serviços Técnicos', value: 0, percentage: 0 },
        ];
        const totalCat = (catRows || []).reduce((acc, curr) => acc + Number(curr.count || 0), 0);
        if (totalCat > 0) {
            categoryDistribution = (catRows || []).map((row) => ({
                name: row.category,
                value: Number(row.count) || 0,
                percentage: Math.round(((Number(row.count) || 0) / totalCat) * 100),
            }));
        }
        const conversionRatePercent = totalViewsWeek > 0
            ? Math.min(Math.round((hotOpportunities / totalViewsWeek) * 100), 100)
            : contactsCount > 0
                ? Math.round((hotOpportunities / contactsCount) * 100)
                : 0;
        return {
            kpis: {
                totalViewsToday,
                totalViewsWeek,
                producersTracked: contactsCount,
                inactiveReheated,
                hotOpportunities,
                conversionRatePercent,
            },
            chartData: chartDays,
            categoryDistribution,
        };
    }
    async getViewers(tenantId, filter) {
        const list = [];
        const seenIdentities = new Set();
        try {
            const [rawViews, activePosts, weekCountsRows] = await Promise.all([
                this.prisma.$queryRawUnsafe(`SELECT 
            v.id,
            v."contactId",
            v.phone,
            v."contactName",
            v.city,
            v.state,
            v."statusMessageId",
            v."storyTitle",
            v.category,
            v."mediaUrl",
            v."viewedAt",
            v."createdAt"
           FROM "whatsapp_status_views" v
           WHERE v."tenantId" = $1
           ORDER BY v."viewedAt" DESC
           LIMIT 120`, tenantId),
                this.prisma.$queryRawUnsafe(`SELECT "messageId", "title", "mediaUrl"
           FROM "whatsapp_status_posts"
           WHERE "tenantId" = $1`, tenantId),
                this.prisma.$queryRawUnsafe(`SELECT "phone", COUNT(*)::int as cnt
           FROM "whatsapp_status_views"
           WHERE "tenantId" = $1 AND "viewedAt" >= NOW() - INTERVAL '7 days'
           GROUP BY "phone"`, tenantId),
            ]);
            if (!rawViews || rawViews.length === 0)
                return [];
            const postMediaByMsgId = new Map();
            const postMediaByTitle = new Map();
            for (const p of activePosts || []) {
                if (p.mediaUrl && !String(p.mediaUrl).includes('172.16.0.1')) {
                    if (p.messageId)
                        postMediaByMsgId.set(String(p.messageId), p.mediaUrl);
                    if (p.title)
                        postMediaByTitle.set(String(p.title), p.mediaUrl);
                }
            }
            const weekCountByPhone = new Map();
            for (const r of weekCountsRows || []) {
                if (r.phone)
                    weekCountByPhone.set(String(r.phone), Number(r.cnt) || 1);
            }
            const contactIds = Array.from(new Set(rawViews.map((v) => v.contactId).filter(Boolean)));
            const phoneSuffixes = Array.from(new Set(rawViews
                .map((v) => {
                const rawDigits = String(v.phone || '').replace(/\D/g, '');
                return rawDigits.length >= 8 && rawDigits.length <= 13 ? rawDigits.slice(-8) : '';
            })
                .filter(Boolean)));
            const orFilters = [];
            if (contactIds.length > 0) {
                orFilters.push({ id: { in: contactIds } });
            }
            for (const suffix of phoneSuffixes.slice(0, 50)) {
                orFilters.push({ phone: { endsWith: suffix } });
            }
            const matchedContacts = orFilters.length > 0
                ? await this.prisma.contact.findMany({
                    where: {
                        tenantId,
                        OR: orFilters,
                    },
                    include: {
                        deals: {
                            include: { assignee: { select: { name: true } } },
                            orderBy: { updatedAt: 'desc' },
                            take: 5,
                        },
                        conversations: {
                            orderBy: { updatedAt: 'desc' },
                            take: 3,
                            include: {
                                messages: {
                                    where: { isInternal: false },
                                    orderBy: { createdAt: 'desc' },
                                    take: 10,
                                },
                            },
                        },
                    },
                })
                : [];
            const contactById = new Map();
            const contactsBySuffix = new Map();
            const contactByLid = new Map();
            for (const c of matchedContacts) {
                contactById.set(c.id, c);
                const cDigits = (c.phone || '').replace(/\D/g, '');
                if (cDigits.length >= 8 && cDigits.length <= 13) {
                    const sfx = cDigits.slice(-8);
                    const arr = contactsBySuffix.get(sfx) || [];
                    arr.push(c);
                    contactsBySuffix.set(sfx, arr);
                }
                if (c.whatsappLid) {
                    contactByLid.set(c.whatsappLid.replace(/\D/g, ''), c);
                }
            }
            const isGenericName = (n) => {
                if (!n)
                    return true;
                const low = n.trim().toLowerCase();
                return (low === 'teste' ||
                    low === 'comercial verto' ||
                    low.startsWith('produtor rural') ||
                    low.startsWith('contato whatsapp') ||
                    low.startsWith('cliente whatsapp') ||
                    /^\+?\d+$/.test(low));
            };
            for (const view of rawViews) {
                const rawDigits = String(view.phone || '').replace(/\D/g, '');
                const suffix8 = rawDigits.length >= 8 && rawDigits.length <= 13 ? rawDigits.slice(-8) : '';
                const siblingContacts = [];
                if (view.contactId && contactById.has(view.contactId)) {
                    siblingContacts.push(contactById.get(view.contactId));
                }
                if (suffix8 && contactsBySuffix.has(suffix8)) {
                    for (const sc of contactsBySuffix.get(suffix8)) {
                        if (!siblingContacts.some((x) => x.id === sc.id)) {
                            siblingContacts.push(sc);
                        }
                    }
                }
                if (rawDigits && contactByLid.has(rawDigits)) {
                    const lc = contactByLid.get(rawDigits);
                    if (!siblingContacts.some((x) => x.id === lc.id)) {
                        siblingContacts.push(lc);
                    }
                }
                const primaryContact = siblingContacts.find((c) => !isGenericName(c.name) && c.conversations?.some((cv) => cv.messages?.length > 0)) ||
                    siblingContacts.find((c) => c.conversations?.some((cv) => cv.messages?.length > 0)) ||
                    siblingContacts.find((c) => !isGenericName(c.name)) ||
                    siblingContacts[0] ||
                    null;
                const effectivePhone = primaryContact?.phone && !primaryContact.phone.includes('@lid') && primaryContact.phone.replace(/\D/g, '').length <= 13
                    ? primaryContact.phone
                    : view.phone;
                const phoneInfo = this.formatBrazilianPhone(effectivePhone);
                const { dateFormatted, timeFormatted, relative } = this.formatDateTime(view.viewedAt);
                const bestSiblingName = siblingContacts.find((c) => !isGenericName(c.name))?.name;
                const effectiveName = bestSiblingName ||
                    (!isGenericName(view.contactName) ? view.contactName : null) ||
                    primaryContact?.name ||
                    view.contactName ||
                    `Contato WhatsApp (${phoneInfo.cleanDigits.slice(-4) || 'WhatsApp'})`;
                const dedupeKey = suffix8
                    ? `sfx:${suffix8}`
                    : primaryContact?.id
                        ? `cid:${primaryContact.id}`
                        : `raw:${view.phone}`;
                if (seenIdentities.has(dedupeKey)) {
                    continue;
                }
                seenIdentities.add(dedupeKey);
                const allTagsSet = new Set();
                const allDealsMap = new Map();
                const allConvsMap = new Map();
                for (const sc of siblingContacts) {
                    for (const t of sc.tags || [])
                        allTagsSet.add(t);
                    for (const d of sc.deals || [])
                        allDealsMap.set(d.id, d);
                    for (const cv of sc.conversations || [])
                        allConvsMap.set(cv.id, cv);
                }
                const mergedTags = Array.from(allTagsSet);
                const contactTags = mergedTags.map((t) => t.toLowerCase());
                const mergedDeals = Array.from(allDealsMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                const mergedConvs = Array.from(allConvsMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                const latestConv = mergedConvs.find((cv) => cv.messages && cv.messages.length > 0) || mergedConvs[0] || null;
                const rawMessages = latestConv?.messages || [];
                const formattedChatMessages = [...rawMessages]
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((m) => ({
                    id: m.id,
                    direction: (m.direction === 'INBOUND' ? 'INBOUND' : 'OUTBOUND'),
                    content: String(m.content || '').trim(),
                    createdAt: new Date(m.createdAt).toISOString(),
                    formattedDate: new Intl.DateTimeFormat('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    }).format(new Date(m.createdAt)),
                }))
                    .filter((m) => m.content.length > 0);
                const lastMsg = rawMessages.find((m) => m.direction === 'INBOUND') || rawMessages[0] || null;
                const lastChatPreview = lastMsg?.content
                    ? String(lastMsg.content)
                        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .slice(0, 110)
                    : undefined;
                const lastChatDateStr = lastMsg?.createdAt
                    ? new Intl.DateTimeFormat('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                    }).format(new Date(lastMsg.createdAt))
                    : undefined;
                const nameLower = effectiveName.toLowerCase();
                const isInternalTeam = contactTags.includes('equipe interna') ||
                    contactTags.includes('colaborador') ||
                    nameLower === 'junior verto' ||
                    nameLower.includes('junior verto soluções') ||
                    nameLower.includes('verto agrícola') ||
                    nameLower.includes('verto agricola') ||
                    nameLower.includes('comercial verto') ||
                    effectivePhone.includes('555499112550');
                const viewsCountWeek = weekCountByPhone.get(String(view.phone)) || 1;
                const interestLevel = viewsCountWeek >= 4
                    ? 'Alta Frequência'
                    : viewsCountWeek >= 2
                        ? 'Frequência Moderada'
                        : 'Visualização Recente';
                const fullConversationTranscript = formattedChatMessages
                    .map((m) => `[${m.direction === 'INBOUND' ? 'CONTATO' : 'VERTO'}]: ${m.content}`)
                    .join('\n');
                const bestAddress = siblingContacts.find((c) => c.address && c.address.trim().length > 2)?.address;
                const locationInfo = this.resolveCityAndState(effectivePhone, bestAddress, view.city, view.state, `${effectiveName} ${fullConversationTranscript}`);
                let totalPurchased = 0;
                let assignedSeller = 'Equipe Comercial Verto';
                let dealId = undefined;
                let dealTitle = undefined;
                let dealValue = undefined;
                if (mergedDeals.length > 0) {
                    const topDeal = mergedDeals[0];
                    assignedSeller = topDeal.assignee?.name || assignedSeller;
                    dealId = topDeal.id;
                    dealTitle = topDeal.title;
                    dealValue = Number(topDeal.value) || 0;
                    const wonDeals = mergedDeals.filter((d) => d.status === 'won');
                    totalPurchased = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
                }
                const classification = await this.classifyLeadByContextAndAi(tenantId, {
                    contactId: primaryContact?.id || view.id,
                    name: effectiveName,
                    phone: effectivePhone,
                    tags: mergedTags,
                    isInternalTeam,
                    deals: mergedDeals,
                    totalPurchased,
                    chatMessages: formattedChatMessages,
                    lastChatPreview,
                    lastChatDateStr,
                    storyTitle: view.storyTitle || 'Status Corporativo WhatsApp',
                    storyCategory: view.category || 'Maquinários',
                    viewsCountWeek,
                    timeFormatted,
                });
                const resolvedThumb = postMediaByMsgId.get(String(view.statusMessageId)) ||
                    postMediaByTitle.get(String(view.storyTitle)) ||
                    (view.mediaUrl && !String(view.mediaUrl).includes('172.16.0.1') ? view.mediaUrl : undefined);
                list.push({
                    id: view.id,
                    contactId: primaryContact?.id || view.contactId || view.id,
                    conversationId: latestConv?.id || undefined,
                    name: effectiveName,
                    companyOrFarm: classification.companyOrFarm,
                    phone: phoneInfo.cleanDigits || effectivePhone,
                    phoneFormatted: phoneInfo.formatted,
                    email: primaryContact?.email || undefined,
                    isLidOnly: phoneInfo.isLidOnly,
                    city: classification.inferredCity || locationInfo.city,
                    state: classification.inferredState || locationInfo.state,
                    crmStatus: classification.crmStatus,
                    crmStatusLabel: classification.crmStatusLabel,
                    intentScore: classification.intentScore,
                    intentLabel: classification.intentLabel,
                    totalPurchased,
                    dealId,
                    dealTitle,
                    dealValue,
                    aiInsight: classification.aiInsight,
                    lastChatMessage: lastChatPreview,
                    lastChatDate: lastChatDateStr,
                    chatMessages: formattedChatMessages,
                    lastPurchaseDate: totalPurchased > 0 ? 'Compra anterior faturada' : undefined,
                    daysInactive: 0,
                    assignedSeller,
                    hasRealView: true,
                    storyMedia: {
                        id: view.statusMessageId || view.id,
                        title: view.storyTitle || 'Status Corporativo WhatsApp',
                        category: view.category || 'Maquinários',
                        viewedAt: relative,
                        exactDate: dateFormatted,
                        exactTime: timeFormatted,
                        viewsCountWeek,
                        interestLevel,
                        thumbnailUrl: resolvedThumb,
                    },
                });
            }
        }
        catch (err) {
            this.logger.error(`Erro ao carregar whatsapp_status_views: ${err.message}`);
        }
        let filtered = list;
        if (filter?.status && filter.status !== 'all') {
            if (filter.status === 'new_leads') {
                filtered = filtered.filter((item) => item.crmStatus === 'prospect' || item.intentLabel?.toLowerCase().includes('lead'));
            }
            else {
                filtered = filtered.filter((item) => item.crmStatus === filter.status);
            }
        }
        if (filter?.category && filter.category !== 'all') {
            filtered = filtered.filter((item) => item.storyMedia.category === filter.category);
        }
        if (filter?.search) {
            const q = filter.search.toLowerCase().trim();
            filtered = filtered.filter((item) => item.name.toLowerCase().includes(q) ||
                item.companyOrFarm.toLowerCase().includes(q) ||
                item.city.toLowerCase().includes(q) ||
                item.phone.includes(q) ||
                (item.phoneFormatted && item.phoneFormatted.toLowerCase().includes(q)) ||
                item.storyMedia.title.toLowerCase().includes(q) ||
                item.assignedSeller.toLowerCase().includes(q));
        }
        return filtered;
    }
    async classifyLeadByContextAndAi(tenantId, params) {
        const contactTags = (params.tags || []).map((t) => t.toLowerCase());
        const nameLower = (params.name || '').toLowerCase();
        const farmTag = (params.tags || []).find((t) => {
            const low = t.toLowerCase();
            return low.includes('fazenda') || low.includes('agro') || low.includes('granja') || low.includes('semente');
        });
        if (params.isInternalTeam) {
            return {
                crmStatus: 'internal_team',
                crmStatusLabel: 'Equipe Interna (Verto)',
                companyOrFarm: 'Verto Agrícola',
                intentScore: 15,
                intentLabel: 'Equipe Interna',
                aiInsight: 'Colaborador ou perfil institucional da Verto acompanhando as publicações no WhatsApp corporativo.',
            };
        }
        if (contactTags.includes('contato pessoal') || contactTags.includes('não comercial') || contactTags.includes('institucional')) {
            return {
                crmStatus: 'non_commercial',
                crmStatusLabel: 'Pessoal / Institucional',
                companyOrFarm: 'Contato Pessoal / Institucional',
                intentScore: 5,
                intentLabel: 'Sem Perfil Comercial',
                aiInsight: 'Contato classificado como pessoal ou institucional, sem vínculo com prospecção de equipamentos agrícolas.',
            };
        }
        const allChatText = params.chatMessages.map((m) => m.content).join(' \n ');
        const combinedLower = `${nameLower} ${allChatText.toLowerCase()}`;
        const isSchoolOrPersonalContext = /\b(escola|col[eé]gio|creche|professora?|recreio|aluno|filho|pai\b|m[aã]e\b|machucou|joelho|buscar na escola|n[uú]mero particular|hospital|cl[ií]nica|consult[oó]rio|m[eé]dico|pediatra|exame)\b/i.test(combinedLower) &&
            !/\b(trator|plantadeira|semeadeira|stara|absoluta|pulverizador|colheitadeira|safra|hectare|soja|milho|implemento|adubo|taxa vari[aá]vel)\b/i.test(combinedLower);
        if (isSchoolOrPersonalContext) {
            return {
                crmStatus: 'non_commercial',
                crmStatusLabel: 'Pessoal / Institucional',
                companyOrFarm: nameLower.includes('escola') || nameLower.includes('colégio') || nameLower.includes('colegio')
                    ? 'Instituição de Ensino / Contato Pessoal'
                    : 'Contato Pessoal / Não Comercial',
                intentScore: 5,
                intentLabel: 'Contexto Pessoal / Escolar (Sem Perfil Comercial)',
                aiInsight: params.chatMessages.length
                    ? `A IA analisou o histórico real da conversa no sistema e identificou assunto pessoal/escolar ("${params.chatMessages[0]?.content.slice(0, 95) || params.lastChatPreview}"), onde foi informado o número particular. Não possui perfil comercial para abordagem de vendas.`
                    : `Contato institucional ("${params.name}") sem histórico de cotação agrícola.`,
            };
        }
        if (params.deals && params.deals.length > 0) {
            const topDeal = params.deals[0];
            const dealValue = Number(topDeal.value) || 0;
            const wonDeals = params.deals.filter((d) => d.status === 'won');
            if (wonDeals.length > 0) {
                return {
                    crmStatus: 'active_client',
                    crmStatusLabel: 'Cliente Comprador',
                    companyOrFarm: farmTag || 'Cliente Carteira Verto',
                    intentScore: Math.min(88 + params.viewsCountWeek * 3, 99),
                    intentLabel: 'Cliente Faturado (Oportunidade de Recompra)',
                    aiInsight: `Comprador ativo da carteira (${params.totalPurchased > 0 ? 'R$ ' + params.totalPurchased.toLocaleString('pt-BR') + ' faturados' : 'histórico confirmado'}) visualizou "${params.storyTitle}". ${params.lastChatPreview
                        ? `Última mensagem no sistema (${params.lastChatDateStr}): "${params.lastChatPreview}".`
                        : 'Momento oportuno para ofertar upgrade tecnológico ou novos equipamentos.'}`,
                };
            }
            if (['proposal', 'negotiation', 'follow-up', 'contacted', 'lead'].includes(topDeal.status)) {
                return {
                    crmStatus: 'open_deal',
                    crmStatusLabel: 'Em Negociação',
                    companyOrFarm: farmTag || 'Produtor em Negociação',
                    intentScore: Math.min(90 + params.viewsCountWeek * 3, 99),
                    intentLabel: 'Orçamento Ativo no Funil (Prioridade)',
                    aiInsight: `Negociação aberta no CRM: "${topDeal.title}"${dealValue > 0 ? ' (R$ ' + dealValue.toLocaleString('pt-BR') + ')' : ''}. Visualizou "${params.storyTitle}" (${params.viewsCountWeek}x na semana). ${params.lastChatPreview
                        ? `Última interação no sistema: "${params.lastChatPreview}". Excelente timing para retomada e fechamento.`
                        : 'Sinal claro de interesse ativo para retomar a proposta.'}`,
                };
            }
            return {
                crmStatus: 'inactive_client',
                crmStatusLabel: 'Reativação de Carteira',
                companyOrFarm: farmTag || 'Produtor / Carteira Verto',
                intentScore: Math.min(76 + params.viewsCountWeek * 4, 94),
                intentLabel: 'Produtor Reaquecido via Story',
                aiInsight: `Contato com histórico anterior no CRM ("${topDeal.title}") voltou a engajar visualizando "${params.storyTitle}". ${params.lastChatPreview ? `Último registro no chat: "${params.lastChatPreview}".` : 'Oportunidade de reativação consultiva.'}`,
            };
        }
        const hasCommercialAgroSignals = /\b(stara|absoluta|apresenta[cç][aã]o|cat[aá]logo|instala[cç][aã]o|v[ií]deo demonstrativo|plantadeira|semeadeira|trator|pulverizador|colheitadeira|implemento|or[cç]amento|proposta|pre[cç]o|valor|condi[cç][aã]o|safra|hectare|soja|milho|dosador|taxa|agricola|agr[ií]cola|lavoura|fazenda)\b/i.test(combinedLower);
        const lastMsgId = params.chatMessages[params.chatMessages.length - 1]?.id || 'no_msg';
        const cacheKey = `${tenantId}_${params.contactId}_${lastMsgId}_${params.tags.join(',')}`;
        if (this.aiClassificationCache.has(cacheKey)) {
            return this.aiClassificationCache.get(cacheKey);
        }
        const apiKey = this.aiService?.masterApiKey || process.env.OPENAI_API_KEY;
        if (params.chatMessages.length > 0 && apiKey) {
            try {
                const client = new openai_1.default({ apiKey, timeout: 3500 });
                const transcript = params.chatMessages
                    .slice(-10)
                    .map((m) => `[${m.formattedDate}] ${m.direction === 'INBOUND' ? 'CONTATO' : 'EQUIPE VERTO'}: ${m.content}`)
                    .join('\n');
                const aiResp = await client.chat.completions.create({
                    model: 'gpt-4o-mini',
                    temperature: 0.1,
                    response_format: { type: 'json_object' },
                    messages: [
                        {
                            role: 'system',
                            content: `Você é um analista sênior de inteligência comercial da Verto Agrícola (empresa de tecnologia agrícola, pilotos automáticos, dosadores, plantio e maquinários).
Analise o NOME DO CONTATO, as TAGS e o HISTÓRICO REAL DE MENSAGENS trocadas no WhatsApp do sistema e classifique este visualizador de Story.

REGRAS ESTRITAS:
1. Se a conversa tratar de assuntos pessoais, familiares, escola de filhos (ex: recreio, filho machucou, número particular), saúde, amigos ou fornecedores sem relação de compra de produtos agrícolas, classifique OBRIGATORIAMENTE como:
   "crmStatus": "non_commercial", "crmStatusLabel": "Pessoal / Institucional", "intentScore": entre 0 e 10.
2. Se a conversa mostrar envio de apresentação comercial, catálogo PDF, vídeos demonstrativos em campo, fotos de instalação em máquinas (ex: Stara Absoluta, plantadeiras, tratores) ou cotação/proposta em andamento, classifique como:
   "crmStatus": "open_deal", "crmStatusLabel": "Em Negociação", "intentScore": entre 82 e 96.
3. Se for um produtor rural ou potencial cliente agrícola tirando dúvidas iniciais ou acompanhando os Stories com perfil de compra, classifique como:
   "crmStatus": "prospect", "crmStatusLabel": "Potencial Comprador", "intentScore": entre 65 e 85.
4. PROIBIDO usar emojis em qualquer campo de texto.
5. Se a conversa mencionar a cidade do contato, retorne em "inferredCity" e a sigla do estado em "inferredState" (ou string vazia se não mencionado).

Retorne estritamente um JSON:
{
  "crmStatus": "active_client" | "open_deal" | "prospect" | "inactive_client" | "internal_team" | "non_commercial",
  "crmStatusLabel": "string curta",
  "companyOrFarm": "perfil conciso do contato (ex: Produtor Rural / Carteira Verto, Instituição de Ensino / Contato Pessoal, etc.)",
  "intentScore": number,
  "intentLabel": "resumo executivo curto sem emojis (máx 40 caracteres)",
  "aiInsight": "diagnóstico claro em 2 frases explicando o contexto real das mensagens trocadas e o motivo da classificação",
  "inferredCity": "nome da cidade se citada na conversa ou vazio",
  "inferredState": "UF se citada ou vazio"
}`,
                        },
                        {
                            role: 'user',
                            content: `Nome do Contato: ${params.name}
Telefone: ${params.phone}
Tags no CRM: ${params.tags.join(', ') || 'Nenhuma'}
Story Visualizado: "${params.storyTitle}" (${params.storyCategory}) - ${params.viewsCountWeek}x na semana

HISTÓRICO REAL DE MENSAGENS NO SISTEMA:
${transcript}`,
                        },
                    ],
                });
                const rawJson = aiResp.choices[0]?.message?.content;
                if (rawJson) {
                    const parsed = JSON.parse(rawJson);
                    const validStatuses = ['active_client', 'open_deal', 'prospect', 'inactive_client', 'internal_team', 'non_commercial'];
                    const status = validStatuses.includes(parsed.crmStatus) ? parsed.crmStatus : 'prospect';
                    const result = {
                        crmStatus: status,
                        crmStatusLabel: String(parsed.crmStatusLabel || 'Potencial Comprador').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim(),
                        companyOrFarm: String(parsed.companyOrFarm || farmTag || 'Produtor / Carteira Verto').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim(),
                        intentScore: Math.max(0, Math.min(99, Number(parsed.intentScore) ?? 65)),
                        intentLabel: String(parsed.intentLabel || 'Análise Contextual IA').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim(),
                        aiInsight: String(parsed.aiInsight || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim(),
                        inferredCity: parsed.inferredCity ? String(parsed.inferredCity).trim() : undefined,
                        inferredState: parsed.inferredState ? String(parsed.inferredState).trim() : undefined,
                    };
                    this.aiClassificationCache.set(cacheKey, result);
                    return result;
                }
            }
            catch (aiErr) {
                this.logger.warn(`[Radar Stories IA] Fallback semântico acionado para ${params.name}: ${aiErr.message}`);
            }
        }
        if (hasCommercialAgroSignals || contactTags.includes('proposta') || contactTags.includes('em negociação')) {
            const res = {
                crmStatus: 'open_deal',
                crmStatusLabel: 'Em Negociação',
                companyOrFarm: farmTag || 'Produtor / Em Atendimento Comercial',
                intentScore: Math.min(84 + params.viewsCountWeek * 4, 96),
                intentLabel: 'Avaliando Apresentação & Soluções Verto',
                aiInsight: `Recebeu materiais técnicos e demonstrações no WhatsApp (${params.lastChatPreview ? `último envio: "${params.lastChatPreview}"` : 'histórico técnico ativo'}) e visualizou o Story "${params.storyTitle}". Forte sinal de avaliação comercial para fechamento.`,
            };
            this.aiClassificationCache.set(cacheKey, res);
            return res;
        }
        if (contactTags.includes('cliente comprador')) {
            return {
                crmStatus: 'active_client',
                crmStatusLabel: 'Cliente Comprador',
                companyOrFarm: farmTag || 'Cliente Carteira Verto',
                intentScore: 88,
                intentLabel: 'Cliente Comprador da Base',
                aiInsight: `Cliente comprador identificado na base Verto visualizou "${params.storyTitle}".`,
            };
        }
        if (contactTags.includes('reativação')) {
            return {
                crmStatus: 'inactive_client',
                crmStatusLabel: 'Reativação de Carteira',
                companyOrFarm: farmTag || 'Produtor / Carteira Verto',
                intentScore: 78,
                intentLabel: 'Reativação de Carteira',
                aiInsight: `Contato marcado para reativação comercial visualizou "${params.storyTitle}".`,
            };
        }
        return {
            crmStatus: 'prospect',
            crmStatusLabel: 'Potencial Comprador',
            companyOrFarm: farmTag || 'Produtor / Carteira Verto',
            intentScore: Math.min(60 + params.viewsCountWeek * 8 + (params.lastChatPreview ? 10 : 0), 90),
            intentLabel: params.viewsCountWeek >= 2 ? 'Interesse Recorrente em Stories' : 'Potencial Comprador Identificado',
            aiInsight: params.lastChatPreview
                ? `Contato com interação no WhatsApp (em ${params.lastChatDateStr}: "${params.lastChatPreview}"). Visualizou "${params.storyTitle}" (${params.viewsCountWeek}x na semana).`
                : `Visualizou "${params.storyTitle}" (${params.storyCategory}) às ${params.timeFormatted.slice(0, 5)} (${params.viewsCountWeek}x na semana). Contato da carteira Verto elegível para qualificação consultiva.`,
        };
    }
    async recordStatusView(tenantId, data) {
        const cleanPhone = data.phone.replace(/\D/g, '');
        const viewedDate = data.viewedAt ? new Date(data.viewedAt) : new Date();
        const statusMsgId = data.statusMessageId || `status_${Date.now()}`;
        const title = data.storyTitle || 'Status Corporativo WhatsApp';
        const category = data.category || 'Geral';
        let contactId = data.contactId;
        let contactName = data.contactName;
        if (!contactId && cleanPhone) {
            const existingContact = await this.prisma.contact.findFirst({
                where: {
                    tenantId,
                    OR: [{ phone: cleanPhone }, { phone: { endsWith: cleanPhone.slice(-8) } }],
                },
            });
            if (existingContact) {
                contactId = existingContact.id;
                contactName = contactName || existingContact.name;
            }
            else {
                const created = await this.prisma.contact.create({
                    data: {
                        tenant: { connect: { id: tenantId } },
                        name: contactName || `Contato WhatsApp (${cleanPhone})`,
                        phone: cleanPhone,
                        source: 'WhatsApp',
                        tags: ['Radar Stories', 'Visualizou Status'],
                    },
                });
                contactId = created.id;
                contactName = created.name;
            }
        }
        let mediaUrl = data.mediaUrl || null;
        if (!mediaUrl) {
            try {
                const post = await this.prisma.$queryRawUnsafe(`SELECT "mediaUrl" FROM "whatsapp_status_posts" 
           WHERE "tenantId" = $1 AND ("messageId" = $2 OR "title" = $3) AND "mediaUrl" IS NOT NULL 
           LIMIT 1`, tenantId, statusMsgId, title);
                if (post?.[0]?.mediaUrl) {
                    mediaUrl = post[0].mediaUrl;
                }
            }
            catch { }
        }
        const id = `view_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await this.prisma.$executeRawUnsafe(`INSERT INTO "whatsapp_status_views"
       ("id", "tenantId", "contactId", "phone", "contactName", "statusMessageId", "storyTitle", "category", "mediaUrl", "viewedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, id, tenantId, contactId || null, cleanPhone, contactName || `Contato (${cleanPhone})`, statusMsgId, title, category, mediaUrl, viewedDate);
        this.logger.log(`[Radar Stories] Visualização registrada: ${cleanPhone} (${contactName}) viu "${title}" em ${viewedDate.toISOString()}`);
        return {
            success: true,
            viewId: id,
            phone: cleanPhone,
            contactName,
            storyTitle: title,
            viewedAt: viewedDate.toISOString(),
        };
    }
    async generateApproach(tenantId, payload) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                aiModel: true,
                aiEnabled: true,
                aiCustomApiKey: true,
                aiPlatformKeyAllowed: true,
                aiTrialDays: true,
                aiTrialStartedAt: true,
                createdAt: true,
            },
        });
        if (!tenant) {
            throw new common_1.BadRequestException('Tenant não encontrado');
        }
        const keyResolution = this.aiService.resolveTenantApiKey(tenant);
        const apiKeyToUse = keyResolution.apiKey || process.env.OPENAI_API_KEY;
        if (!apiKeyToUse) {
            throw new common_1.BadRequestException('Nenhuma chave OpenAI ativa para o seu workspace. Configure sua chave em Configurações > Inteligência Artificial.');
        }
        let chatHistoryContext = 'Nenhuma conversa prévia registrada no Inbox.';
        let dealsContext = payload.lastPurchaseInfo || 'Sem negócios registrados no funil.';
        if (payload.contactId) {
            try {
                const [recentMessages, deals] = await Promise.all([
                    this.prisma.message.findMany({
                        where: {
                            tenantId,
                            contactId: payload.contactId,
                            isInternal: false,
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 8,
                    }),
                    this.prisma.deal.findMany({
                        where: { tenantId, contactId: payload.contactId },
                        orderBy: { updatedAt: 'desc' },
                        take: 3,
                    }),
                ]);
                if (recentMessages && recentMessages.length > 0) {
                    chatHistoryContext = recentMessages
                        .reverse()
                        .map((m) => {
                        const dt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(m.createdAt));
                        const who = m.direction === 'INBOUND' ? 'CLIENTE' : 'VENDEDOR';
                        return `[${dt}] ${who}: ${String(m.content || '').slice(0, 200)}`;
                    })
                        .join('\n');
                }
                if (deals && deals.length > 0) {
                    dealsContext = deals
                        .map((d) => `- Negócio: "${d.title}" | Status: ${d.status} | Valor: R$ ${Number(d.value || 0).toLocaleString('pt-BR')} | Notas: ${d.notes || 'Sem notas'}`)
                        .join('\n');
                }
            }
            catch { }
        }
        const client = new openai_1.default({ apiKey: apiKeyToUse });
        const systemPrompt = `Você é um diretor comercial consultivo de alto padrão do Agronegócio e Indústria B2B brasileira (${tenant.name}).
Sua missão é formular a "Abordagem Comercial Casual Perfeita" para um produtor rural / cliente que acabou de visualizar um Status/Story de WhatsApp da empresa.

DIRETRIZES ESTRITAS DE CONVERSÃO:
1. JAMAIS mencione que 'vi que você olhou meu status/story'. Isso soa invasivo.
2. Use o HISTÓRICO REAL DE CONVERSAS e os NEGÓCIOS NO CRM fornecidos abaixo para criar uma ponte natural (ex: retomar uma dúvida anterior, comentar sobre uma condição/lote da linha que ele está acompanhando, ou atualizar sobre implementos na região dele).
3. Tom de voz profissional, consultivo, direto e natural para WhatsApp corporativo (sem emojis infantis e sem parecer mensagem automática).
4. Finalize com UMA pergunta aberta e fácil de responder que puxe o cliente para a negociação.
5. Retorne estritamente um JSON com as chaves:
{
  "casualMessage": "Mensagem pronta para enviar agora pelo WhatsApp",
  "strategicReasoning": "Diagnóstico comercial baseado no histórico real do cliente e no Story visualizado",
  "suggestedTiming": "Recomendação de abordagem imediata",
  "suggestedProduct": "Produto/linha em foco para fechamento"
}`;
        const userPrompt = `DADOS DO CLIENTE:
- Nome: ${payload.producerName}
- Empresa / Fazenda: ${payload.companyOrFarm || 'Carteira ' + tenant.name}
- Cidade / UF: ${payload.city || 'Região Sul'} - ${payload.state || 'RS'}
- Classificação no CRM: ${payload.crmStatus}
- Frequência de Visualizações de Stories na Semana: ${payload.viewsCountWeek || 1}x

NEGÓCIOS E ORÇAMENTOS NO CRM:
${dealsContext}

ÚLTIMAS MENSAGENS REAIS TROCADAS NO WHATSAPP COM ESTE CLIENTE:
${chatHistoryContext}

STORY QUE ELE ACABOU DE VISUALIZAR:
- Título/Conteúdo: "${payload.statusTitle}"
- Categoria: ${payload.statusCategory}

Gere a abordagem comercial personalizada em JSON.`;
        try {
            const completion = await client.chat.completions.create({
                model: tenant.aiModel || 'gpt-4o-mini',
                temperature: 0.6,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            });
            const raw = completion.choices[0]?.message?.content;
            if (!raw) {
                throw new Error('A OpenAI retornou uma resposta vazia.');
            }
            const parsed = JSON.parse(raw);
            return {
                success: true,
                modelUsed: tenant.aiModel || 'gpt-4o-mini',
                data: {
                    casualMessage: parsed.casualMessage || '',
                    strategicReasoning: parsed.strategicReasoning || '',
                    suggestedTiming: parsed.suggestedTiming || 'Envio imediato recomendado',
                    suggestedProduct: parsed.suggestedProduct || payload.statusTitle,
                },
            };
        }
        catch (err) {
            this.logger.error(`Erro ao gerar abordagem com OpenAI: ${err?.message}`, err?.stack);
            throw new common_1.BadRequestException(`Falha ao comunicar com a OpenAI: ${err?.message || 'Verifique sua chave de API.'}`);
        }
    }
    async sendDirectApproach(tenantId, body) {
        if (!body.message || !body.message.trim()) {
            throw new common_1.BadRequestException('O texto da mensagem é obrigatório.');
        }
        const cleanPhone = String(body.phone || '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 13) {
            throw new common_1.BadRequestException('Este visualizador ainda está com identificador privado (@lid). Edite ou confirme o número de telefone com DDD antes de disparar.');
        }
        let contact = body.contactId
            ? await this.prisma.contact.findFirst({ where: { id: body.contactId, tenantId } })
            : null;
        if (!contact) {
            contact = await this.prisma.contact.findFirst({
                where: {
                    tenantId,
                    OR: [{ phone: cleanPhone }, { phone: { endsWith: cleanPhone.slice(-8) } }],
                },
            });
        }
        if (!contact) {
            contact = await this.prisma.contact.create({
                data: {
                    tenantId,
                    name: body.contactName || `Cliente WhatsApp (${cleanPhone.slice(-4)})`,
                    phone: cleanPhone,
                    source: 'Radar de Stories',
                    tags: ['Radar Stories', 'Abordado via Story'],
                },
            });
        }
        else {
            const tags = Array.isArray(contact.tags) ? [...contact.tags] : [];
            if (!tags.includes('Abordado via Story'))
                tags.push('Abordado via Story');
            await this.prisma.contact.update({
                where: { id: contact.id },
                data: { tags },
            });
        }
        let conversationId = '';
        if (this.chatService) {
            const conversation = await this.chatService.getConversationByContact(tenantId, contact.id);
            conversationId = conversation.id;
            await this.chatService.sendManualMessage(tenantId, conversation.id, {
                content: body.message.trim(),
                type: 'text',
            });
        }
        else {
            throw new common_1.BadRequestException('Serviço de Chat indisponível no momento.');
        }
        let createdDeal = null;
        if (body.createDeal) {
            createdDeal = await this.convertViewerToDeal(tenantId, {
                contactId: contact.id,
                phone: cleanPhone,
                contactName: contact.name,
                storyTitle: body.storyTitle || 'Interesse via Story WhatsApp',
            });
        }
        return {
            success: true,
            contactId: contact.id,
            conversationId,
            deal: createdDeal?.deal || null,
            message: `Abordagem enviada com sucesso para ${contact.name} pelo WhatsApp do sistema!`,
        };
    }
    async convertViewerToDeal(tenantId, body) {
        const cleanPhone = String(body.phone || '').replace(/\D/g, '');
        let contact = body.contactId
            ? await this.prisma.contact.findFirst({ where: { id: body.contactId, tenantId } })
            : null;
        if (!contact && cleanPhone.length >= 10) {
            contact = await this.prisma.contact.findFirst({
                where: {
                    tenantId,
                    OR: [{ phone: cleanPhone }, { phone: { endsWith: cleanPhone.slice(-8) } }],
                },
            });
        }
        if (!contact) {
            contact = await this.prisma.contact.create({
                data: {
                    tenantId,
                    name: body.contactName || `Produtor (${cleanPhone.slice(-4)})`,
                    phone: cleanPhone || body.phone,
                    source: 'Radar de Stories',
                    tags: ['Radar Stories', 'Em Negociação'],
                },
            });
        }
        const existingOpenDeal = await this.prisma.deal.findFirst({
            where: {
                tenantId,
                contactId: contact.id,
                status: { in: ['lead', 'contacted', 'proposal', 'negotiation', 'follow-up'] },
            },
            orderBy: { updatedAt: 'desc' },
        });
        if (existingOpenDeal) {
            const updated = await this.prisma.deal.update({
                where: { id: existingOpenDeal.id },
                data: {
                    notes: `${existingOpenDeal.notes ? existingOpenDeal.notes + '\n' : ''}[Radar de Stories ${new Date().toLocaleDateString('pt-BR')}]: Visualizou o Story "${body.storyTitle}".`,
                    updatedAt: new Date(),
                },
            });
            return {
                success: true,
                alreadyExisted: true,
                deal: updated,
                message: `Negócio existente "${updated.title}" atualizado e reaquecido no Funil CRM!`,
            };
        }
        const seller = await this.prisma.user.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'asc' },
        });
        const dealTitle = `${body.storyTitle} — ${contact.name}`.slice(0, 120);
        const createdDeal = await this.prisma.deal.create({
            data: {
                tenantId,
                contactId: contact.id,
                assignedTo: seller?.id || null,
                title: dealTitle,
                value: body.estimatedValue ? Number(body.estimatedValue) : 0,
                status: 'contacted',
                notes: `Oportunidade gerada pelo Radar de Stories & Status após o cliente visualizar "${body.storyTitle}" (${body.category || 'Maquinários'}).`,
            },
        });
        const currentTags = Array.isArray(contact.tags) ? [...contact.tags] : [];
        if (!currentTags.includes('Em Negociação'))
            currentTags.push('Em Negociação');
        await this.prisma.contact.update({
            where: { id: contact.id },
            data: { tags: currentTags },
        });
        return {
            success: true,
            alreadyExisted: false,
            deal: createdDeal,
            message: `Oportunidade "${createdDeal.title}" criada com sucesso no Funil Comercial (CRM)!`,
        };
    }
    async updatePost(tenantId, postId, data) {
        const existing = await this.prisma.$queryRawUnsafe(`SELECT * FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "id" = $2 LIMIT 1`, tenantId, postId);
        if (!existing || existing.length === 0) {
            throw new common_1.BadRequestException('Story ativo não encontrado.');
        }
        const updates = [];
        const values = [];
        let paramIdx = 1;
        if (data.title !== undefined) {
            updates.push(`"title" = $${paramIdx++}`);
            values.push(data.title);
        }
        if (data.category !== undefined) {
            updates.push(`"category" = $${paramIdx++}`);
            values.push(data.category);
        }
        if (data.mediaUrl !== undefined) {
            updates.push(`"mediaUrl" = $${paramIdx++}`);
            values.push(data.mediaUrl);
        }
        if (data.mediaType !== undefined) {
            updates.push(`"mediaType" = $${paramIdx++}`);
            values.push(data.mediaType);
        }
        if (data.postedAt !== undefined) {
            updates.push(`"postedAt" = $${paramIdx++}`);
            values.push(new Date(data.postedAt));
        }
        if (updates.length > 0) {
            values.push(tenantId, postId);
            await this.prisma.$executeRawUnsafe(`UPDATE "whatsapp_status_posts" SET ${updates.join(', ')} WHERE "tenantId" = $${paramIdx++} AND "id" = $${paramIdx}`, ...values);
        }
        return {
            success: true,
            message: 'Story atualizado com sucesso!',
            activePosts: await this.getActivePosts(tenantId),
        };
    }
    async updateViewerContact(tenantId, viewId, data) {
        const existingView = await this.prisma.$queryRawUnsafe(`SELECT * FROM "whatsapp_status_views" WHERE "tenantId" = $1 AND "id" = $2 LIMIT 1`, tenantId, viewId);
        const oldPhone = existingView?.[0]?.phone || '';
        const cleanNewPhone = data.phone ? data.phone.replace(/\D/g, '') : undefined;
        let resolvedContactId = data.contactId;
        let resolvedName = data.contactName;
        if (cleanNewPhone && cleanNewPhone.length >= 10) {
            const normalizedE164 = cleanNewPhone.startsWith('55') ? cleanNewPhone : `55${cleanNewPhone}`;
            const contact = await this.prisma.contact.findFirst({
                where: {
                    tenantId,
                    OR: [{ phone: normalizedE164 }, { phone: cleanNewPhone }, { phone: { endsWith: cleanNewPhone.slice(-8) } }],
                },
            });
            if (contact) {
                resolvedContactId = contact.id;
                resolvedName = resolvedName || contact.name;
                if (oldPhone.length > 13 || oldPhone.includes('@lid')) {
                    await this.prisma.contact
                        .update({
                        where: { id: contact.id },
                        data: { whatsappLid: oldPhone.includes('@lid') ? oldPhone : `${oldPhone}@lid` },
                    })
                        .catch(() => { });
                }
            }
        }
        const updates = [];
        const values = [];
        let paramIdx = 1;
        if (cleanNewPhone !== undefined) {
            updates.push(`"phone" = $${paramIdx++}`);
            values.push(cleanNewPhone.startsWith('55') ? cleanNewPhone : `55${cleanNewPhone}`);
        }
        if (resolvedName !== undefined) {
            updates.push(`"contactName" = $${paramIdx++}`);
            values.push(resolvedName);
        }
        if (resolvedContactId !== undefined) {
            updates.push(`"contactId" = $${paramIdx++}`);
            values.push(resolvedContactId);
        }
        if (updates.length > 0) {
            values.push(tenantId, viewId);
            await this.prisma.$executeRawUnsafe(`UPDATE "whatsapp_status_views" SET ${updates.join(', ')} WHERE "tenantId" = $${paramIdx++} AND "id" = $${paramIdx}`, ...values);
        }
        return { success: true, message: 'Contato vinculado e atualizado com sucesso!' };
    }
    sha256Meta(value) {
        const clean = (value || '').trim().toLowerCase();
        if (!clean)
            return '';
        return (0, crypto_1.createHash)('sha256').update(clean, 'utf8').digest('hex');
    }
    normalizeMetaText(value) {
        return (value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
    }
    async exportMetaAudience(tenantId, viewerIds, mode = 'sha256') {
        const allViewers = await this.getViewers(tenantId);
        let selected = allViewers;
        if (viewerIds && viewerIds.length > 0) {
            const idSet = new Set(viewerIds);
            selected = allViewers.filter((v) => idSet.has(v.id));
        }
        const rows = [];
        rows.push('email,phone,fn,ln,ct,st,country,value');
        for (const v of selected) {
            const cleanPhone = (v.phone || '').replace(/\D/g, '');
            if (cleanPhone.length < 10 || cleanPhone.length > 13) {
                continue;
            }
            const e164Digits = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
            const rawName = (v.name || '')
                .replace(/^Produtor Rural.*$/i, '')
                .replace(/^Contato WhatsApp.*$/i, '')
                .trim();
            const nameParts = rawName.split(/\s+/).filter(Boolean);
            const rawFn = nameParts[0] || '';
            const rawLn = nameParts.slice(1).join(' ') || '';
            const rawEmail = (v.email || '').trim().toLowerCase();
            const rawCt = v.city && v.city !== 'Região Sul' ? v.city : 'Passo Fundo';
            const rawSt = v.state || 'RS';
            const rawCountry = 'br';
            const dealVal = v.totalPurchased > 0 ? v.totalPurchased : v.dealValue && v.dealValue > 0 ? v.dealValue : 1000;
            if (mode === 'sha256') {
                const hashedEmail = rawEmail ? this.sha256Meta(rawEmail) : '';
                const hashedPhone = this.sha256Meta(e164Digits);
                const hashedFn = rawFn ? this.sha256Meta(this.normalizeMetaText(rawFn)) : '';
                const hashedLn = rawLn ? this.sha256Meta(this.normalizeMetaText(rawLn)) : '';
                const hashedCt = this.sha256Meta(this.normalizeMetaText(rawCt).replace(/\s+/g, ''));
                const hashedSt = this.sha256Meta(this.normalizeMetaText(rawSt));
                const hashedCountry = this.sha256Meta(rawCountry);
                rows.push(`${hashedEmail},${hashedPhone},${hashedFn},${hashedLn},${hashedCt},${hashedSt},${hashedCountry},${dealVal}`);
            }
            else {
                rows.push(`"${rawEmail}","+${e164Digits}","${rawFn}","${rawLn}","${rawCt}","${rawSt}","BR","${dealVal}"`);
            }
        }
        const csvContent = rows.join('\r\n');
        const timestamp = new Date().toISOString().slice(0, 10);
        const suffix = mode === 'sha256' ? 'sha256_criptografado' : 'comercial';
        const filename = `publico_meta_ads_stories_${suffix}_${timestamp}.csv`;
        return {
            success: true,
            mode,
            filename,
            totalContacts: rows.length - 1,
            csvContent,
        };
    }
    async createCampaignFromViewers(tenantId, data) {
        if (!data.campaignName || !data.viewerIds || data.viewerIds.length === 0) {
            throw new common_1.BadRequestException('Nome da campanha e seleção de visualizadores são obrigatórios.');
        }
        const allViewers = await this.getViewers(tenantId);
        const idSet = new Set(data.viewerIds);
        const targets = allViewers.filter((v) => idSet.has(v.id) && !v.isLidOnly && v.phone.replace(/\D/g, '').length <= 13);
        let scheduledMessagesCount = 0;
        let createdDealsCount = 0;
        if (this.chatService && targets.length > 0) {
            for (let i = 0; i < targets.length; i++) {
                const viewer = targets[i];
                try {
                    const firstName = viewer.name.split(' ')[0] || 'amigo';
                    const customText = data.messageTemplate?.trim()
                        ? data.messageTemplate
                            .replace(/\{\{nome\}\}/gi, firstName)
                            .replace(/\{\{produto\}\}/gi, viewer.storyMedia.title)
                        : `Olá ${firstName}, tudo bem? Estávamos revisando o atendimento da região aqui na equipe comercial sobre a linha "${viewer.storyMedia.title}". Você chegou a avaliar a necessidade para a sua operação nesta safra?`;
                    const scheduledDate = new Date(Date.now() + (i + 1) * 45 * 1000);
                    const conv = await this.chatService.getConversationByContact(tenantId, viewer.contactId);
                    await this.chatService.scheduleMessage(tenantId, conv.id, {
                        content: customText,
                        scheduledAt: scheduledDate.toISOString(),
                        type: 'text',
                    });
                    scheduledMessagesCount++;
                    if (viewer.crmStatus === 'prospect') {
                        await this.convertViewerToDeal(tenantId, {
                            contactId: viewer.contactId,
                            phone: viewer.phone,
                            contactName: viewer.name,
                            storyTitle: viewer.storyMedia.title,
                            category: viewer.storyMedia.category,
                        }).catch(() => { });
                        createdDealsCount++;
                    }
                }
                catch (err) {
                    this.logger.warn(`[Campanha Radar Stories] Aviso ao enfileirar contato ${viewer.phone}: ${err.message}`);
                }
            }
        }
        this.logger.log(`[Campanha Radar Stories] Campanha "${data.campaignName}" executada: ${scheduledMessagesCount} abordagens agendadas com Anti-Ban e ${createdDealsCount} novos negócios no CRM.`);
        return {
            success: true,
            campaignId: `camp_stories_${Date.now()}`,
            campaignName: data.campaignName,
            objective: data.objective,
            totalAudience: targets.length,
            scheduledMessagesCount,
            createdDealsCount,
            createdAt: new Date().toISOString(),
            message: scheduledMessagesCount > 0
                ? `Campanha "${data.campaignName}" iniciada! ${scheduledMessagesCount} abordagens personalizadas foram enfileiradas no WhatsApp com intervalo Anti-Ban (45s) e ${createdDealsCount} oportunidades abertas no CRM.`
                : `Campanha "${data.campaignName}" registrada para ${data.viewerIds.length} contatos!`,
        };
    }
    async deletePost(tenantId, postId) {
        this.logger.log(`[RadarStories] Excluindo post [${postId}] do tenant [${tenantId}]`);
        await this.prisma.$executeRawUnsafe(`DELETE FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND ("id" = $2 OR "messageId" = $2)`, tenantId, postId);
        return { success: true, message: 'Story excluído com sucesso da vitrine!' };
    }
    async updateViewerClassification(tenantId, viewId, body) {
        const { crmStatus, contactId } = body;
        this.logger.log(`[RadarStories] Atualizando classificação do visualizador [${viewId}], contactId [${contactId}] para [${crmStatus}]`);
        if (contactId) {
            const contact = await this.prisma.contact.findFirst({
                where: { id: contactId, tenantId },
            });
            if (contact) {
                let tags = Array.isArray(contact.tags) ? [...contact.tags] : [];
                tags = tags.filter((t) => ![
                    'equipe interna',
                    'colaborador',
                    'cliente comprador',
                    'em negociação',
                    'potencial comprador',
                    'reativação',
                    'não categorizado',
                    'contato pessoal',
                    'não comercial',
                    'institucional',
                ].includes(t.toLowerCase()));
                if (crmStatus === 'internal_team') {
                    tags.push('Equipe Interna');
                }
                else if (crmStatus === 'non_commercial') {
                    tags.push('Contato Pessoal');
                }
                else if (crmStatus === 'active_client') {
                    tags.push('Cliente Comprador');
                }
                else if (crmStatus === 'open_deal') {
                    tags.push('Em Negociação');
                }
                else if (crmStatus === 'inactive_client') {
                    tags.push('Reativação');
                }
                else {
                    tags.push('Potencial Comprador');
                }
                await this.prisma.contact.update({
                    where: { id: contactId },
                    data: { tags },
                });
                this.aiClassificationCache.clear();
            }
        }
        return {
            success: true,
            crmStatus,
            message: 'Classificação comercial do contato atualizada e salva com sucesso!',
        };
    }
};
exports.RadarStoriesService = RadarStoriesService;
exports.RadarStoriesService = RadarStoriesService = RadarStoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService,
        chat_gateway_1.ChatGateway,
        storage_service_1.StorageService,
        whatsapp_service_1.WhatsappService,
        chat_service_1.ChatService])
], RadarStoriesService);
//# sourceMappingURL=radar-stories.service.js.map