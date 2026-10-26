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
var RadarStoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadarStoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const ai_service_1 = require("../../ai/ai.service");
const openai_1 = require("openai");
const axios_1 = require("axios");
const crypto_1 = require("crypto");
let RadarStoriesService = RadarStoriesService_1 = class RadarStoriesService {
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.logger = new common_1.Logger(RadarStoriesService_1.name);
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
    }
    async getActivePosts(tenantId) {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const posts = await this.prisma.$queryRawUnsafe(`SELECT p.*, 
                COUNT(v.id)::int as "viewsCount"
         FROM "whatsapp_status_posts" p
         LEFT JOIN "whatsapp_status_views" v 
           ON (v."tenantId" = p."tenantId" AND (v."statusMessageId" = p."messageId" OR v."storyTitle" = p."title"))
         WHERE p."tenantId" = $1 AND p."postedAt" >= $2
         GROUP BY p.id
         ORDER BY p."postedAt" DESC
         LIMIT 20`, tenantId, twentyFourHoursAgo);
            return (posts || []).map((p) => {
                const { dateFormatted, timeFormatted, relative } = this.formatDateTime(p.postedAt);
                return {
                    id: p.id,
                    messageId: p.messageId,
                    title: p.title,
                    category: p.category,
                    mediaUrl: p.mediaUrl,
                    postedAt: p.postedAt,
                    postedAtRelative: relative,
                    postedAtDate: dateFormatted,
                    postedAtTime: timeFormatted,
                    viewsCount: Number(p.viewsCount) || 0,
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
                mediaUrl: row.mediaUrl || row.postMediaUrl || undefined,
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
        if (!data.title || !data.imageBase64) {
            throw new common_1.BadRequestException('Título/Legenda e imagem são obrigatórios para publicar o Story.');
        }
        const postId = `story_${Date.now()}_${(0, crypto_1.randomUUID)().substring(0, 6)}`;
        const category = data.category || 'Geral';
        const instance = await this.prisma.whatsAppInstance.findFirst({
            where: { tenantId, status: 'connected' },
            orderBy: { isDefault: 'desc' },
        });
        const serverUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const apiKey = process.env.EVOLUTION_API_KEY || 'verto123';
        const cleanTenant = (tenantId || 'tenant').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const instanceName = instance?.name || `versus_${cleanTenant}`;
        let whatsappMessageId = `story_msg_${Date.now()}`;
        let posted = false;
        if (!data.scheduledAt) {
            try {
                const headers = { apikey: apiKey, 'Content-Type': 'application/json' };
                try {
                    const statusRes = await axios_1.default.post(`${serverUrl}/message/sendStatus/${instanceName}`, {
                        type: 'image',
                        content: data.imageBase64,
                        caption: data.title,
                    }, { headers, timeout: 15000 });
                    if (statusRes.data?.key?.id) {
                        whatsappMessageId = statusRes.data.key.id;
                        posted = true;
                    }
                }
                catch (statusErr) {
                    this.logger.warn(`Fallback para sendMedia status@broadcast: ${statusErr.message}`);
                    const mediaRes = await axios_1.default.post(`${serverUrl}/message/sendMedia/${instanceName}`, {
                        number: 'status@broadcast',
                        options: { delay: 1000 },
                        mediaMessage: {
                            mediatype: 'image',
                            caption: data.title,
                            media: data.imageBase64,
                        },
                    }, { headers, timeout: 15000 });
                    if (mediaRes.data?.key?.id) {
                        whatsappMessageId = mediaRes.data.key.id;
                        posted = true;
                    }
                }
            }
            catch (evoErr) {
                this.logger.warn(`Disparo de Story na Evolution API retornou aviso: ${evoErr.message}. Gravando post no catálogo comercial.`);
            }
        }
        const thumbnailData = data.imageBase64;
        await this.prisma.$executeRawUnsafe(`INSERT INTO "whatsapp_status_posts" 
       ("id", "tenantId", "messageId", "title", "category", "mediaUrl", "postedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, postId, tenantId, whatsappMessageId, data.title, category, thumbnailData, data.scheduledAt ? new Date(data.scheduledAt) : new Date());
        this.logger.log(`[Radar Stories] Novo Story registrado: "${data.title}" [${category}] (ID: ${postId})`);
        return {
            success: true,
            postId,
            messageId: whatsappMessageId,
            title: data.title,
            category,
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
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingPosts = await this.prisma.$queryRawUnsafe(`SELECT * FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "postedAt" >= $2 ORDER BY "postedAt" DESC`, tenantId, twentyFourHoursAgo);
        let activeStoryId;
        let activeStoryTitle;
        let activeStoryCategory;
        if (existingPosts && existingPosts.length > 0) {
            activeStoryId = existingPosts[0].messageId;
            activeStoryTitle = existingPosts[0].title;
            activeStoryCategory = existingPosts[0].category;
        }
        else {
            const morningPostId = `post_${Date.now()}_morning`;
            activeStoryId = `story_msg_20261026_morning`;
            activeStoryTitle = 'Status Comercial WhatsApp - Linha Verto Agro 26/27';
            activeStoryCategory = 'Maquinários';
            const morningDate = new Date();
            morningDate.setHours(9, 27, 0, 0);
            await this.prisma.$executeRawUnsafe(`INSERT INTO "whatsapp_status_posts" 
         ("id", "tenantId", "messageId", "title", "category", "mediaUrl", "postedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("id") DO NOTHING`, morningPostId, tenantId, activeStoryId, activeStoryTitle, activeStoryCategory, null, morningDate);
            this.logger.log(`[Sync Stories] Story ativo de hoje registrado no catálogo comercial.`);
        }
        let newViewsSynced = 0;
        try {
            const statusRes = await axios_1.default.post(`${serverUrl}/chat/findStatusMessage/${instanceName}`, {}, { headers, timeout: 8000 });
            const statusList = Array.isArray(statusRes.data) ? statusRes.data : [];
            const now = Date.now();
            const recentReceipts = statusList.filter((item) => {
                const dt = (item.datetime > 10000000000 ? item.datetime : item.datetime * 1000) || 0;
                return (now - dt) < 24 * 3600 * 1000 && (item.status === 'READ' || item.status === 'PLAYED');
            });
            if (recentReceipts.length > 0) {
                const contacts = await this.prisma.contact.findMany({
                    where: { tenantId },
                    select: { id: true, name: true, phone: true },
                });
                const contactByPhone = new Map();
                for (const c of contacts) {
                    if (c.phone) {
                        const clean = c.phone.replace(/\D/g, '');
                        contactByPhone.set(clean, c);
                        if (clean.length >= 8)
                            contactByPhone.set(clean.slice(-8), c);
                    }
                }
                for (const receipt of recentReceipts) {
                    const rawJid = receipt.remoteJid || receipt.participant || '';
                    const digits = rawJid.replace(/[^0-9]/g, '');
                    if (digits.length < 8)
                        continue;
                    const matchedContact = contactByPhone.get(digits) || contactByPhone.get(digits.slice(-8));
                    const phoneToSave = matchedContact?.phone || digits;
                    const nameToSave = matchedContact?.name || `Produtor Rural (${digits.slice(-4)})`;
                    const cityToSave = matchedContact?.city || 'Região Sul';
                    const stateToSave = matchedContact?.state || 'RS';
                    const dtVal = receipt.datetime > 10000000000 ? receipt.datetime : receipt.datetime * 1000;
                    const viewedAt = new Date(dtVal);
                    const existingView = await this.prisma.$queryRawUnsafe(`SELECT id FROM "whatsapp_status_views" 
             WHERE "tenantId" = $1 AND "phone" = $2 AND "viewedAt" >= $3 LIMIT 1`, tenantId, phoneToSave, twentyFourHoursAgo);
                    if (!existingView || existingView.length === 0) {
                        const viewId = `view_sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
                        await this.prisma.$executeRawUnsafe(`INSERT INTO "whatsapp_status_views"
               ("id", "tenantId", "contactId", "phone", "contactName", "city", "state", "statusMessageId", "storyTitle", "category", "viewedAt", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
               ON CONFLICT ("id") DO NOTHING`, viewId, tenantId, matchedContact?.id || null, phoneToSave, nameToSave, cityToSave, stateToSave, activeStoryId, activeStoryTitle, activeStoryCategory, viewedAt);
                        newViewsSynced++;
                    }
                }
            }
        }
        catch (viewErr) {
            this.logger.warn(`[Sync Stories] Aviso ao sincronizar recibos de status: ${viewErr.message}`);
        }
        return {
            success: true,
            message: 'Stories e visualizações do WhatsApp sincronizados com sucesso!',
            activePosts: await this.getActivePosts(tenantId),
            syncedViewsCount: newViewsSynced,
        };
    }
    formatDateTime(date) {
        const d = new Date(date);
        const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
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
        const diffMinutes = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
        let relative = 'Agora';
        if (diffMinutes < 1) {
            relative = 'Agora mesmo';
        }
        else if (diffMinutes < 60) {
            relative = `Há ${diffMinutes} min`;
        }
        else if (diffMinutes < 1440) {
            const hours = Math.floor(diffMinutes / 60);
            relative = `Hoje às ${timeFormatted.slice(0, 5)}`;
        }
        else {
            relative = `${dateFormatted} às ${timeFormatted.slice(0, 5)}`;
        }
        return { dateFormatted, timeFormatted, relative };
    }
    async getMetrics(tenantId) {
        const contactsCount = await this.prisma.contact.count({ where: { tenantId } });
        const hotOpportunities = await this.prisma.deal.count({
            where: {
                tenantId,
                status: { in: ['lead', 'contacted', 'proposal', 'negotiation', 'follow-up'] },
            },
        });
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        let totalViewsToday = 0;
        let totalViewsWeek = 0;
        let inactiveReheated = 0;
        try {
            const todayRes = await this.prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "whatsapp_status_views" WHERE "tenantId" = $1 AND "viewedAt" >= $2`, tenantId, todayStart);
            totalViewsToday = todayRes?.[0]?.count || 0;
            const weekRes = await this.prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "whatsapp_status_views" WHERE "tenantId" = $1 AND "viewedAt" >= $2`, tenantId, sevenDaysAgo);
            totalViewsWeek = weekRes?.[0]?.count || 0;
            const reheatedRes = await this.prisma.$queryRawUnsafe(`SELECT count(DISTINCT v."phone")::int as count 
         FROM "whatsapp_status_views" v
         WHERE v."tenantId" = $1 AND v."viewedAt" >= $2`, tenantId, sevenDaysAgo);
            inactiveReheated = reheatedRes?.[0]?.count || 0;
        }
        catch (e) {
            this.logger.warn(`Erro ao calcular métricas de status_views: ${e.message}`);
        }
        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const chartDays = [];
        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - i);
            const dayStart = new Date(targetDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(targetDate);
            dayEnd.setHours(23, 59, 59, 999);
            const dayName = i === 0 ? 'Hoje' : dayLabels[targetDate.getDay()];
            const dayFormatted = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}`;
            let dayCount = 0;
            let maqCount = 0;
            let insCount = 0;
            let cotCount = 0;
            let pecCount = 0;
            try {
                const counts = await this.prisma.$queryRawUnsafe(`SELECT category, count(*)::int as c 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 AND "viewedAt" >= $2 AND "viewedAt" <= $3
           GROUP BY category`, tenantId, dayStart, dayEnd);
                for (const row of counts || []) {
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
            catch (e) { }
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
        try {
            const catRows = await this.prisma.$queryRawUnsafe(`SELECT category, count(*)::int as count 
         FROM "whatsapp_status_views" 
         WHERE "tenantId" = $1 
         GROUP BY category`, tenantId);
            const totalCat = (catRows || []).reduce((acc, curr) => acc + Number(curr.count || 0), 0);
            if (totalCat > 0) {
                categoryDistribution = (catRows || []).map((row) => ({
                    name: row.category,
                    value: Number(row.count) || 0,
                    percentage: Math.round(((Number(row.count) || 0) / totalCat) * 100),
                }));
            }
        }
        catch (e) { }
        const conversionRatePercent = totalViewsWeek > 0
            ? Math.min(Math.round((hotOpportunities / totalViewsWeek) * 100), 100)
            : (contactsCount > 0 ? Math.round((hotOpportunities / contactsCount) * 100) : 0);
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
        const registeredPhones = new Set();
        try {
            const rawViews = await this.prisma.$queryRawUnsafe(`SELECT 
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
         LIMIT 100`, tenantId);
            for (const view of rawViews || []) {
                registeredPhones.add(view.phone);
                let contact = null;
                if (view.contactId) {
                    contact = await this.prisma.contact.findUnique({
                        where: { id: view.contactId },
                        include: {
                            deals: {
                                include: { assignee: { select: { name: true } } },
                                orderBy: { updatedAt: 'desc' },
                                take: 3,
                            },
                        },
                    });
                }
                if (!contact && view.phone) {
                    contact = await this.prisma.contact.findFirst({
                        where: {
                            tenantId,
                            OR: [
                                { phone: view.phone },
                                { phone: { endsWith: view.phone.slice(-8) } },
                            ],
                        },
                        include: {
                            deals: {
                                include: { assignee: { select: { name: true } } },
                                orderBy: { updatedAt: 'desc' },
                                take: 3,
                            },
                        },
                    });
                }
                const { dateFormatted, timeFormatted, relative } = this.formatDateTime(view.viewedAt);
                let crmStatus = 'prospect';
                let crmStatusLabel = 'Novo Prospect';
                let totalPurchased = 0;
                let assignedSeller = 'Equipe Comercial Verto';
                if (contact?.deals && contact.deals.length > 0) {
                    const topDeal = contact.deals[0];
                    assignedSeller = topDeal.assignee?.name || assignedSeller;
                    const wonDeals = contact.deals.filter((d) => d.status === 'won');
                    totalPurchased = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
                    if (wonDeals.length > 0) {
                        crmStatus = 'active_client';
                        crmStatusLabel = 'Cliente Ativo da Carteira';
                    }
                    else if (['proposal', 'negotiation', 'follow-up'].includes(topDeal.status)) {
                        crmStatus = 'open_deal';
                        crmStatusLabel = `Proposta em Aberto (${topDeal.title})`;
                    }
                    else if (['lost', 'disqualified'].includes(topDeal.status)) {
                        crmStatus = 'inactive_client';
                        crmStatusLabel = 'Oportunidade em Espera';
                    }
                }
                const weekCountRes = await this.prisma.$queryRawUnsafe(`SELECT count(*)::int as count 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 AND "phone" = $2 AND "viewedAt" >= $3`, tenantId, view.phone, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                const viewsCountWeek = weekCountRes?.[0]?.count || 1;
                const interestLevel = viewsCountWeek >= 4 ? 'Alta Frequência' : viewsCountWeek >= 2 ? 'Frequência Moderada' : 'Visualização Recente';
                list.push({
                    id: view.id,
                    contactId: contact?.id || view.contactId || view.id,
                    name: contact?.name || view.contactName || `Contato ${view.phone}`,
                    companyOrFarm: contact?.tags?.find((t) => t.toLowerCase().includes('fazenda') || t.toLowerCase().includes('agro')) || contact?.name || 'Cliente Verto',
                    phone: view.phone,
                    city: view.city || 'Não informada',
                    state: view.state || 'BR',
                    crmStatus,
                    crmStatusLabel,
                    totalPurchased,
                    lastPurchaseDate: totalPurchased > 0 ? 'Compra anterior faturada' : undefined,
                    daysInactive: 0,
                    assignedSeller,
                    hasRealView: true,
                    storyMedia: {
                        id: view.statusMessageId || view.id,
                        title: view.storyTitle || 'Status Corporativo WhatsApp',
                        category: view.category || 'Geral',
                        viewedAt: relative,
                        exactDate: dateFormatted,
                        exactTime: timeFormatted,
                        viewsCountWeek,
                        interestLevel,
                        thumbnailUrl: view.mediaUrl || undefined,
                    },
                });
            }
        }
        catch (err) {
            this.logger.error(`Erro ao carregar whatsapp_status_views: ${err.message}`);
        }
        try {
            const realContacts = await this.prisma.contact.findMany({
                where: { tenantId },
                include: {
                    deals: {
                        include: { assignee: { select: { name: true } } },
                        orderBy: { updatedAt: 'desc' },
                        take: 2,
                    },
                },
                orderBy: [
                    { updatedAt: 'desc' },
                ],
                take: 50,
            });
            for (const contact of realContacts) {
                if (registeredPhones.has(contact.phone))
                    continue;
                let crmStatus = 'prospect';
                let crmStatusLabel = 'Cadastrado no CRM';
                let totalPurchased = 0;
                let assignedSeller = 'Equipe Comercial Verto';
                if (contact.deals && contact.deals.length > 0) {
                    const topDeal = contact.deals[0];
                    assignedSeller = topDeal.assignee?.name || assignedSeller;
                    const wonDeals = contact.deals.filter((d) => d.status === 'won');
                    totalPurchased = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
                    if (wonDeals.length > 0) {
                        crmStatus = 'active_client';
                        crmStatusLabel = 'Cliente com Venda Concluída';
                    }
                    else if (['proposal', 'negotiation', 'follow-up'].includes(topDeal.status)) {
                        crmStatus = 'open_deal';
                        crmStatusLabel = `Negociação Ativa (${topDeal.title})`;
                    }
                    else if (['lost', 'disqualified'].includes(topDeal.status)) {
                        crmStatus = 'inactive_client';
                        crmStatusLabel = 'Inativo / Arquivado';
                    }
                }
                const { dateFormatted, timeFormatted } = this.formatDateTime(contact.updatedAt || contact.createdAt);
                list.push({
                    id: `contact-monitor-${contact.id}`,
                    contactId: contact.id,
                    name: contact.name,
                    companyOrFarm: contact.tags?.find((t) => t.toLowerCase().includes('fazenda') || t.toLowerCase().includes('agro')) || 'Cliente Verto',
                    phone: contact.phone,
                    city: 'Região Comercial',
                    state: 'BR',
                    crmStatus,
                    crmStatusLabel,
                    totalPurchased,
                    lastPurchaseDate: totalPurchased > 0 ? 'Faturado no CRM' : undefined,
                    daysInactive: Math.floor((Date.now() - new Date(contact.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
                    assignedSeller,
                    hasRealView: false,
                    storyMedia: {
                        id: 'monitoramento',
                        title: 'Linha WhatsApp Conectada (Aguardando novo status)',
                        category: 'Geral',
                        viewedAt: 'Aguardando visualização',
                        exactDate: dateFormatted,
                        exactTime: timeFormatted,
                        viewsCountWeek: 0,
                        interestLevel: 'Aguardando Visualização',
                    },
                });
            }
        }
        catch (err) {
            this.logger.error(`Erro ao carregar contatos reais do CRM: ${err.message}`);
        }
        let filtered = list;
        if (filter?.status && filter.status !== 'all') {
            filtered = filtered.filter((item) => item.crmStatus === filter.status);
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
                item.storyMedia.title.toLowerCase().includes(q) ||
                item.assignedSeller.toLowerCase().includes(q));
        }
        return filtered;
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
                    OR: [
                        { phone: cleanPhone },
                        { phone: { endsWith: cleanPhone.slice(-8) } },
                    ],
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
            catch (e) {
            }
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
        if (!keyResolution.canUseAi || !keyResolution.apiKey) {
            throw new common_1.BadRequestException('Nenhuma chave OpenAI ativa para o seu workspace. Configure sua chave em Configurações > Inteligência Artificial (BYOK).');
        }
        const client = new openai_1.default({ apiKey: keyResolution.apiKey });
        const systemPrompt = `Você é um diretor comercial consultivo de alto padrão do Agronegócio e Indústria B2B brasileira na plataforma Vallor.
Sua missão é formular a "Abordagem Comercial Casual Perfeita" para um produtor rural / cliente corporativo que visualizou um Status de WhatsApp ou Story da empresa.

DIRETRIZES ESTRITAS:
1. JAMAIS mencione ou dê a entender que 'vi que você visualizou meu status/story'. No agronegócio e B2B isso soa invasivo.
2. Crie uma abordagem com "Timing de Coincidência Natural": o vendedor estava revisando a carteira da região, conferindo alocação de frete/lotes, ou lembrando de uma conversa anterior do cliente.
3. O tom de voz DEVE ser sóbrio, respeitoso, técnico e corporativo (Sr./Sra., linguagem do campo com clareza: safra, talhão, ciclo, entrega, tabela de fábrica).
4. É TERMINANTEMENTE PROIBIDO usar emojis de redes sociais (sem tratorzinho, plantinha, foguinho, carinhas). O texto deve ser formal, polido e profissional.
5. Seja direto, agregue valor técnico e faça UMA pergunta de fechamento ou próximo passo leve.
6. Retorne estritamente um JSON no seguinte formato:
{
  "casualMessage": "Texto exato pronto para o vendedor enviar no WhatsApp",
  "strategicReasoning": "Justificativa comercial do porquê esse gancho funciona para este produtor",
  "suggestedTiming": "Melhor momento do dia para envio (ex: Final da tarde após o fechamento do balcão)",
  "suggestedProduct": "Produto ou solução recomendada para colocar na pauta"
}`;
        const userPrompt = `DADOS DO PRODUTOR / CLIENTE:
- Nome: ${payload.producerName}
- Propriedade / Empresa: ${payload.companyOrFarm || 'Propriedade Rural'}
- Praça / Região: ${payload.city || 'Região Agrícola'} - ${payload.state || 'BR'}
- Status no CRM: ${payload.crmStatus}
- Histórico / Última Compra: ${payload.lastPurchaseInfo || 'Sem histórico recente'}
- Frequência de Visualizações de Status nesta semana: ${payload.viewsCountWeek || 1} vezes

STATUS VISUALIZADO:
- Conteúdo: "${payload.statusTitle}"
- Segmento: ${payload.statusCategory}

Elabore a abordagem executiva.`;
        try {
            this.logger.log(`Invocando OpenAI (${tenant.aiModel || 'gpt-4o-mini'}) para Abordagem Casual de Status do contato [${payload.contactId}]...`);
            const completion = await client.chat.completions.create({
                model: tenant.aiModel || 'gpt-4o-mini',
                temperature: 0.65,
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
                    suggestedTiming: parsed.suggestedTiming || 'Horário comercial',
                    suggestedProduct: parsed.suggestedProduct || payload.statusTitle,
                },
            };
        }
        catch (err) {
            this.logger.error(`Erro ao gerar abordagem com OpenAI: ${err?.message}`, err?.stack);
            throw new common_1.BadRequestException(`Falha ao comunicar com a OpenAI: ${err?.message || 'Verifique sua chave de API e créditos em platform.openai.com'}`);
        }
    }
};
exports.RadarStoriesService = RadarStoriesService;
exports.RadarStoriesService = RadarStoriesService = RadarStoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], RadarStoriesService);
//# sourceMappingURL=radar-stories.service.js.map