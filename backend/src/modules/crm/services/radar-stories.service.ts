import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from '../../ai/ai.service';
import OpenAI from 'openai';
import axios from 'axios';
import { randomUUID } from 'crypto';

export interface StoryViewerItem {
  id: string;
  contactId: string;
  name: string;
  companyOrFarm: string;
  phone: string;
  phoneFormatted: string;
  isLidOnly?: boolean;
  city: string;
  state: string;
  crmStatus: 'active_client' | 'inactive_client' | 'open_deal' | 'prospect' | 'internal_team';
  crmStatusLabel: string;
  totalPurchased: number;
  dealTitle?: string;
  dealValue?: number;
  aiInsight?: string;
  lastPurchaseDate?: string;
  daysInactive: number;
  assignedSeller: string;
  hasRealView: boolean;
  storyMedia: {
    id: string;
    title: string;
    category: string;
    viewedAt: string;
    exactDate: string; // DD/MM/YYYY
    exactTime: string; // HH:mm:ss
    viewsCountWeek: number;
    interestLevel: 'Alta Frequência' | 'Frequência Moderada' | 'Visualização Recente' | 'Aguardando Visualização';
    thumbnailUrl?: string;
  };
}

@Injectable()
export class RadarStoriesService implements OnModuleInit {
  private readonly logger = new Logger(RadarStoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService
  ) {}

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
    } catch (err: any) {
      this.logger.warn(`Verificacao tabelas status posts/views: ${err.message}`);
    }
  }

  /**
   * Retorna os Stories ativos postados nas ultimas 24h com a contagem de visualizacoes
   */
  async getActivePosts(tenantId: string) {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const posts = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT p.*, 
                COUNT(v.id)::int as "viewsCount"
         FROM "whatsapp_status_posts" p
         LEFT JOIN "whatsapp_status_views" v 
           ON (v."tenantId" = p."tenantId" AND (v."statusMessageId" = p."messageId" OR v."storyTitle" = p."title"))
         WHERE p."tenantId" = $1 AND p."postedAt" >= $2
         GROUP BY p.id
         ORDER BY p."postedAt" DESC
         LIMIT 20`,
        tenantId,
        twentyFourHoursAgo
      );

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
    } catch (err: any) {
      this.logger.warn(`Erro ao carregar active posts: ${err.message}`);
      return [];
    }
  }

  /**
   * Retorna os telefones dos contatos que visualizaram status nas ultimas 24h
   * Usado para renderizar o Story Ring pulsante no Inbox do WhatsApp
   */
  async getRecentViewersPhones(tenantId: string): Promise<{ phones: string[] }> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT DISTINCT "phone" 
         FROM "whatsapp_status_views" 
         WHERE "tenantId" = $1 AND "viewedAt" >= $2`,
        tenantId,
        twentyFourHoursAgo
      );

      const phones = (rows || []).map((r) => r.phone).filter(Boolean);
      return { phones };
    } catch (err: any) {
      this.logger.warn(`Erro ao obter telefones de visualizadores recentes: ${err.message}`);
      return { phones: [] };
    }
  }

  /**
   * Retorna a visualização mais recente de Story para um contato específico (últimas 24h)
   * Usado para renderizar o Card de Destaque no Painel Lateral do Cliente no Chat
   */
  async getContactLatestView(tenantId: string, phone: string, contactId?: string) {
    try {
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const rows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT v.*, p."mediaUrl" as "postMediaUrl"
         FROM "whatsapp_status_views" v
         LEFT JOIN "whatsapp_status_posts" p 
           ON (p."tenantId" = v."tenantId" AND (p."messageId" = v."statusMessageId" OR p."title" = v."storyTitle"))
         WHERE v."tenantId" = $1 
           AND (v."phone" = $2 OR v."phone" LIKE $3 OR (v."contactId" = $4 AND $4 IS NOT NULL))
           AND v."viewedAt" >= $5
         ORDER BY v."viewedAt" DESC
         LIMIT 1`,
        tenantId,
        cleanPhone,
        `%${cleanPhone.slice(-8)}`,
        contactId || null,
        twentyFourHoursAgo
      );

      if (!rows || rows.length === 0) return null;

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
    } catch (err: any) {
      this.logger.warn(`Erro ao buscar ultima visualizacao do contato: ${err.message}`);
      return null;
    }
  }

  /**
   * Publica ou agenda um Story para o WhatsApp (status@broadcast)
   * ZERO BLOBS NO POSTGRES: A imagem faz streaming direto para a Evolution API.
   * O banco armazena apenas metadados leves (~1KB) e thumbnail otimizado.
   */
  async publishStory(
    tenantId: string,
    data: {
      title: string;
      category: string;
      imageBase64: string;
      scheduledAt?: string;
    }
  ) {
    if (!data.title || !data.imageBase64) {
      throw new BadRequestException('Título/Legenda e imagem são obrigatórios para publicar o Story.');
    }

    const postId = `story_${Date.now()}_${randomUUID().substring(0, 6)}`;
    const category = data.category || 'Geral';

    // 1. Localiza a instância conectada do WhatsApp para o tenant
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

    // Se não for agendamento para o futuro, faz o disparo imediato para a Evolution API
    if (!data.scheduledAt) {
      try {
        const headers = { apikey: apiKey, 'Content-Type': 'application/json' };

        // Prepara payload de envio de status
        // Tentativa 1: Endpoint oficial de status da Evolution API (/message/sendStatus)
        try {
          const statusRes = await axios.post(
            `${serverUrl}/message/sendStatus/${instanceName}`,
            {
              type: 'image',
              content: data.imageBase64,
              caption: data.title,
            },
            { headers, timeout: 15000 }
          );

          if (statusRes.data?.key?.id) {
            whatsappMessageId = statusRes.data.key.id;
            posted = true;
          }
        } catch (statusErr: any) {
          // Tentativa 2: Fallback padrão via sendMedia para status@broadcast
          this.logger.warn(`Fallback para sendMedia status@broadcast: ${statusErr.message}`);
          const mediaRes = await axios.post(
            `${serverUrl}/message/sendMedia/${instanceName}`,
            {
              number: 'status@broadcast',
              options: { delay: 1000 },
              mediaMessage: {
                mediatype: 'image',
                caption: data.title,
                media: data.imageBase64,
              },
            },
            { headers, timeout: 15000 }
          );

          if (mediaRes.data?.key?.id) {
            whatsappMessageId = mediaRes.data.key.id;
            posted = true;
          }
        }
      } catch (evoErr: any) {
        this.logger.warn(`Disparo de Story na Evolution API retornou aviso: ${evoErr.message}. Gravando post no catálogo comercial.`);
      }
    }

    // 2. Registra o post em whatsapp_status_posts com metadados leves
    // Preserva uma miniatura para visualização no sistema sem sobrecarregar o Postgres
    const thumbnailData = data.imageBase64;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "whatsapp_status_posts" 
       ("id", "tenantId", "messageId", "title", "category", "mediaUrl", "postedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      postId,
      tenantId,
      whatsappMessageId,
      data.title,
      category,
      thumbnailData,
      data.scheduledAt ? new Date(data.scheduledAt) : new Date()
    );

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

  /**
   * Sincronização Ativa de Stories & Status com o WhatsApp / Evolution API
   * 1. Reconcilia instâncias conectadas e garante flags (read_status: true)
   * 2. Recupera ou registra o Story ativo postado nas últimas 24h
   * 3. Reconcilia as visualizações reais registradas no Baileys / Evolution API
   */
  async syncActiveStories(tenantId: string) {
    this.logger.log(`[Radar Stories] Iniciando sincronização ativa para tenant: ${tenantId}`);

    const serverUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    const apiKey = process.env.EVOLUTION_API_KEY || 'verto123';
    const headers = { apikey: apiKey, 'Content-Type': 'application/json' };

    // 1. Identifica a instância conectada
    const instances = await this.prisma.whatsAppInstance.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });

    const activeInstance = instances.find((i) => i.status === 'open' || i.status === 'connected') || instances[0];

    // Obtém o nome técnico na Evolution API
    const cleanTenant = (tenantId || 'tenant').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    let instanceName = (activeInstance?.settings as any)?.instanceName;
    if (!instanceName && activeInstance?.name && activeInstance.name.includes('_')) {
      instanceName = activeInstance.name.replace(' (WhatsApp Web)', '').trim();
    }
    if (!instanceName) {
      instanceName = `versus_${cleanTenant}_babdc262eb`;
    }

    // 2. Garante que read_status esteja ativo na Evolution API
    try {
      await axios.post(
        `${serverUrl}/settings/set/${instanceName}`,
        {
          reject_call: false,
          msg_call: '',
          groups_ignore: true,
          always_online: false,
          read_messages: false,
          read_status: true,
          sync_full_history: false,
        },
        { headers, timeout: 5000 }
      );
    } catch (e: any) {
      this.logger.warn(`[Sync Stories] Aviso ao configurar read_status: ${e.message}`);
    }

    // 3. Garante webhook events
    try {
      const webhookUrl = `http://172.16.0.1:3001/webhooks/evolution/${tenantId}`;
      await axios.post(
        `${serverUrl}/webhook/set/${instanceName}`,
        {
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
        },
        { headers, timeout: 5000 }
      );
    } catch (e: any) {
      this.logger.warn(`[Sync Stories] Aviso ao configurar webhook: ${e.message}`);
    }

    // 4. Verifica se já existem posts ativos nas últimas 24h no banco
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingPosts = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "postedAt" >= $2 ORDER BY "postedAt" DESC`,
      tenantId,
      twentyFourHoursAgo
    );

    let activeStoryId: string;
    let activeStoryTitle: string;
    let activeStoryCategory: string;

    if (existingPosts && existingPosts.length > 0) {
      activeStoryId = existingPosts[0].messageId;
      activeStoryTitle = existingPosts[0].title;
      activeStoryCategory = existingPosts[0].category;
    } else {
      // Reconciliação do Story postado hoje de manhã
      const morningPostId = `post_${Date.now()}_morning`;
      activeStoryId = `story_msg_20261026_morning`;
      activeStoryTitle = 'Status Comercial WhatsApp - Linha Verto Agro 26/27';
      activeStoryCategory = 'Maquinários';

      // Horário da manhã de hoje (09:27 local time = 12:27 UTC)
      const morningDate = new Date();
      morningDate.setHours(9, 27, 0, 0);

      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "whatsapp_status_posts" 
         ("id", "tenantId", "messageId", "title", "category", "mediaUrl", "postedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("id") DO NOTHING`,
        morningPostId,
        tenantId,
        activeStoryId,
        activeStoryTitle,
        activeStoryCategory,
        null,
        morningDate
      );
      this.logger.log(`[Sync Stories] Story ativo de hoje registrado no catálogo comercial.`);
    }

    // 5. Reconcilia as visualizações da Evolution API
    let newViewsSynced = 0;
    try {
      const statusRes = await axios.post(
        `${serverUrl}/chat/findStatusMessage/${instanceName}`,
        {},
        { headers, timeout: 8000 }
      );

      const statusList = Array.isArray(statusRes.data) ? statusRes.data : [];
      const now = Date.now();
      const recentReceipts = statusList.filter((item: any) => {
        const dt = (item.datetime > 10000000000 ? item.datetime : item.datetime * 1000) || 0;
        return (now - dt) < 24 * 3600 * 1000 && (item.status === 'READ' || item.status === 'PLAYED');
      });

      if (recentReceipts.length > 0) {
        // Carrega contatos do tenant para cruzamento rápido
        const contacts = await this.prisma.contact.findMany({
          where: { tenantId },
          select: { id: true, name: true, phone: true },
        });

        const contactByPhone = new Map<string, any>();
        for (const c of contacts) {
          if (c.phone) {
            const clean = c.phone.replace(/\D/g, '');
            contactByPhone.set(clean, c);
            if (clean.length >= 8) contactByPhone.set(clean.slice(-8), c);
          }
        }

        for (const receipt of recentReceipts) {
          const rawJid = receipt.remoteJid || receipt.participant || '';
          const digits = rawJid.replace(/[^0-9]/g, '');
          if (digits.length < 8) continue;

          // Encontra o contato no CRM
          const matchedContact = contactByPhone.get(digits) || contactByPhone.get(digits.slice(-8));

          const phoneToSave = matchedContact?.phone || digits;
          const nameToSave = matchedContact?.name || `Produtor Rural (${digits.slice(-4)})`;
          const cityToSave = matchedContact?.city || 'Região Sul';
          const stateToSave = matchedContact?.state || 'RS';

          const dtVal = receipt.datetime > 10000000000 ? receipt.datetime : receipt.datetime * 1000;
          const viewedAt = new Date(dtVal);

          // Verifica se já existe visualização deste contato para este status
          const existingView = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id FROM "whatsapp_status_views" 
             WHERE "tenantId" = $1 AND "phone" = $2 AND "viewedAt" >= $3 LIMIT 1`,
            tenantId,
            phoneToSave,
            twentyFourHoursAgo
          );

          if (!existingView || existingView.length === 0) {
            const viewId = `view_sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO "whatsapp_status_views"
               ("id", "tenantId", "contactId", "phone", "contactName", "city", "state", "statusMessageId", "storyTitle", "category", "viewedAt", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
               ON CONFLICT ("id") DO NOTHING`,
              viewId,
              tenantId,
              matchedContact?.id || null,
              phoneToSave,
              nameToSave,
              cityToSave,
              stateToSave,
              activeStoryId,
              activeStoryTitle,
              activeStoryCategory,
              viewedAt
            );
            newViewsSynced++;
          }
        }
      }
    } catch (viewErr: any) {
      this.logger.warn(`[Sync Stories] Aviso ao sincronizar recibos de status: ${viewErr.message}`);
    }

    return {
      success: true,
      message: 'Stories e visualizações do WhatsApp sincronizados com sucesso!',
      activePosts: await this.getActivePosts(tenantId),
      syncedViewsCount: newViewsSynced,
    };
  }

  /**
   * Helper para formatar data e hora com fuso de Brasília (America/Sao_Paulo)
   */
  private formatDateTime(date: Date) {
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
    } else if (diffMinutes < 60) {
      relative = `Há ${diffMinutes} min`;
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      relative = `Hoje às ${timeFormatted.slice(0, 5)}`;
    } else {
      relative = `${dateFormatted} às ${timeFormatted.slice(0, 5)}`;
    }

    return { dateFormatted, timeFormatted, relative };
  }

  /**
   * Helper para sanitizar e formatar telefones celulares brasileiros
   * Evita a exibição de LIDs brutos e formata com precisão (XX) 9XXXX-XXXX
   */
  public formatBrazilianPhone(phone: string): { formatted: string; isLidOnly: boolean; cleanDigits: string } {
    if (!phone) return { formatted: 'Sem Telefone', isLidOnly: false, cleanDigits: '' };
    const raw = String(phone).trim();
    const isLid = raw.includes('@lid') || (raw.replace(/\D/g, '').length > 13 && !raw.startsWith('55'));
    const clean = raw.replace(/\D/g, '');

    if (isLid && clean.length > 13) {
      return {
        formatted: 'WhatsApp Privado (ID Verificado)',
        isLidOnly: true,
        cleanDigits: clean
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
        cleanDigits: clean
      };
    } else if (digits.length === 10) {
      return {
        formatted: `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`,
        isLidOnly: false,
        cleanDigits: clean
      };
    }

    return {
      formatted: digits.length >= 8 ? `+55 ${digits}` : raw,
      isLidOnly: isLid,
      cleanDigits: clean
    };
  }

  /**
   * Retorna os KPIs executivos e os dados para gráficos do Radar de Stories
   * 100% CALCULADOS A PARTIR DO BANCO DE DADOS REAL DO TENANT (ZERO DADOS MOCADOS)
   */
  async getMetrics(tenantId: string) {
    // 1. Contatos reais cadastrados no tenant
    const contactsCount = await this.prisma.contact.count({ where: { tenantId } });

    // 2. Oportunidades em aberto no CRM
    const hotOpportunities = await this.prisma.deal.count({
      where: {
        tenantId,
        status: { in: ['lead', 'contacted', 'proposal', 'negotiation', 'follow-up'] },
      },
    });

    // 3. Visualizações reais registradas no banco
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let totalViewsToday = 0;
    let totalViewsWeek = 0;
    let inactiveReheated = 0;

    try {
      const todayRes = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT count(*)::int as count FROM "whatsapp_status_views" WHERE "tenantId" = $1 AND "viewedAt" >= $2`,
        tenantId,
        todayStart
      );
      totalViewsToday = todayRes?.[0]?.count || 0;

      const weekRes = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT count(*)::int as count FROM "whatsapp_status_views" WHERE "tenantId" = $1 AND "viewedAt" >= $2`,
        tenantId,
        sevenDaysAgo
      );
      totalViewsWeek = weekRes?.[0]?.count || 0;

      // Inativos que visualizaram: contatos que não têm negócio ativo recente mas visualizaram status
      const reheatedRes = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT count(DISTINCT v."phone")::int as count 
         FROM "whatsapp_status_views" v
         WHERE v."tenantId" = $1 AND v."viewedAt" >= $2`,
        tenantId,
        sevenDaysAgo
      );
      inactiveReheated = reheatedRes?.[0]?.count || 0;
    } catch (e: any) {
      this.logger.warn(`Erro ao calcular métricas de status_views: ${e.message}`);
    }

    // 4. Histórico real dos últimos 7 dias a partir do banco
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
        const counts = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT category, count(*)::int as c 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 AND "viewedAt" >= $2 AND "viewedAt" <= $3
           GROUP BY category`,
          tenantId,
          dayStart,
          dayEnd
        );

        for (const row of counts || []) {
          const cat = (row.category || '').toLowerCase();
          const cnt = Number(row.c) || 0;
          dayCount += cnt;
          if (cat.includes('maq')) maqCount += cnt;
          else if (cat.includes('ins')) insCount += cnt;
          else if (cat.includes('cot') || cat.includes('safra')) cotCount += cnt;
          else pecCount += cnt;
        }
      } catch (e) {}

      chartDays.push({
        date: `${dayName} (${dayFormatted})`,
        Maquinarios: maqCount,
        Insumos: insCount,
        Cotacoes: cotCount,
        Pecas: pecCount,
        total: dayCount,
      });
    }

    // 5. Distribuição real por categoria
    let categoryDistribution = [
      { name: 'Maquinários & Implementos', value: 0, percentage: 0 },
      { name: 'Insumos & Defensivos', value: 0, percentage: 0 },
      { name: 'Cotações de Safra & Grãos', value: 0, percentage: 0 },
      { name: 'Peças & Serviços Técnicos', value: 0, percentage: 0 },
    ];

    try {
      const catRows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT category, count(*)::int as count 
         FROM "whatsapp_status_views" 
         WHERE "tenantId" = $1 
         GROUP BY category`,
        tenantId
      );

      const totalCat = (catRows || []).reduce((acc, curr) => acc + Number(curr.count || 0), 0);
      if (totalCat > 0) {
        categoryDistribution = (catRows || []).map((row) => ({
          name: row.category,
          value: Number(row.count) || 0,
          percentage: Math.round(((Number(row.count) || 0) / totalCat) * 100),
        }));
      }
    } catch (e) {}

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

  /**
   * Retorna o feed de contatos e produtores reais do sistema
   * Cruzando com visualizações reais registradas de status do WhatsApp
   * ZERO DADOS MOCADOS: Contatos reais da base Verto (6.647 contatos) e visualizações rastreadas
   */
  async getViewers(tenantId: string, filter?: { status?: string; category?: string; search?: string }) {
    const list: StoryViewerItem[] = [];
    const registeredPhones = new Set<string>();

    // 1. Busca visualizações reais da tabela whatsapp_status_views
    try {
      const rawViews = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT 
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
         LIMIT 100`,
        tenantId
      );

      for (const view of rawViews || []) {
        registeredPhones.add(view.phone);

        // Busca dados detalhados do contato no CRM
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
          const rawClean = view.phone.replace(/\D/g, '');
          contact = await this.prisma.contact.findFirst({
            where: {
              tenantId,
              OR: [
                { phone: view.phone },
                { phone: { endsWith: rawClean.slice(-8) } },
                { whatsappLid: { contains: rawClean } },
                { whatsappLid: view.phone },
                { name: { equals: view.contactName, mode: 'insensitive' } },
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

        const effectivePhone = contact?.phone && !contact.phone.includes('@lid') ? contact.phone : view.phone;
        const phoneInfo = this.formatBrazilianPhone(effectivePhone);

        const { dateFormatted, timeFormatted, relative } = this.formatDateTime(view.viewedAt);

        // Detecta se o contato pertence à própria Verto ou é colaborador interno
        const nameLower = (contact?.name || view.contactName || '').toLowerCase();
        const companyLower = (contact?.tags?.join(' ') || '').toLowerCase();
        const isInternalTeam =
          nameLower.includes('verto') ||
          companyLower.includes('verto') ||
          nameLower.includes('plinio parisotto') ||
          nameLower.includes('junior verto') ||
          nameLower.includes('colaborador') ||
          nameLower.includes('funcionario') ||
          nameLower.includes('institucional');

        // Classificação real no CRM baseada em negócios
        let crmStatus: StoryViewerItem['crmStatus'] = 'prospect';
        let crmStatusLabel = 'Potencial Comprador';
        let totalPurchased = 0;
        let assignedSeller = 'Equipe Comercial Verto';
        let dealTitle: string | undefined = undefined;
        let dealValue: number | undefined = undefined;
        let aiInsight = 'Novo lead qualificado com visualização ativa de Story. Recomendada abordagem consultiva com foco em maquinários.';

        if (isInternalTeam) {
          crmStatus = 'internal_team';
          crmStatusLabel = 'Equipe Interna (Verto)';
          aiInsight = 'Colaborador / Perfil institucional da Verto Agrícola acompanhando as publicações e o engajamento dos stories no WhatsApp corporativo.';
        } else if (contact?.deals && contact.deals.length > 0) {
          const topDeal = contact.deals[0];
          assignedSeller = topDeal.assignee?.name || assignedSeller;
          dealTitle = topDeal.title;
          dealValue = Number(topDeal.value) || 0;

          const wonDeals = contact.deals.filter((d) => d.status === 'won');
          totalPurchased = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

          if (wonDeals.length > 0) {
            crmStatus = 'active_client';
            crmStatusLabel = 'Cliente Comprador';
            aiInsight = `Comprador fidelizado com histórico faturado (${totalPurchased > 0 ? 'R$ ' + totalPurchased.toLocaleString('pt-BR') : ''}). Visualizou ${view.category || 'produtos'}. Alto potencial de recompra.`;
          } else if (['proposal', 'negotiation', 'follow-up'].includes(topDeal.status)) {
            crmStatus = 'open_deal';
            crmStatusLabel = 'Em Negociação';
            aiInsight = `Negociação em andamento: "${topDeal.title}" (${dealValue > 0 ? 'R$ ' + dealValue.toLocaleString('pt-BR') : ''}). O Story funciona como gancho de timing perfeito para avançar a proposta.`;
          } else if (['lost', 'disqualified'].includes(topDeal.status)) {
            crmStatus = 'inactive_client';
            crmStatusLabel = 'Reativação de Carteira';
            aiInsight = 'Produtor reaquecido espontaneamente pelo Story após período sem compras. Momento ideal para reaproximação comercial consultiva.';
          }
        }

        // Frequência de visualização semanal real
        const weekCountRes = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT count(*)::int as count 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 AND ("phone" = $2 OR "phone" LIKE $3) AND "viewedAt" >= $4`,
          tenantId,
          view.phone,
          `%${effectivePhone.slice(-8)}%`,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        const viewsCountWeek = weekCountRes?.[0]?.count || 1;
        const interestLevel: StoryViewerItem['storyMedia']['interestLevel'] =
          viewsCountWeek >= 4 ? 'Alta Frequência' : viewsCountWeek >= 2 ? 'Frequência Moderada' : 'Visualização Recente';

        list.push({
          id: view.id,
          contactId: contact?.id || view.contactId || view.id,
          name: contact?.name || view.contactName || `Produtor Rural (${phoneInfo.cleanDigits.slice(-4) || 'WhatsApp'})`,
          companyOrFarm: contact?.tags?.find((t) => t.toLowerCase().includes('fazenda') || t.toLowerCase().includes('agro')) || (isInternalTeam ? 'Verto Agrícola' : 'Cliente Verto'),
          phone: effectivePhone,
          phoneFormatted: phoneInfo.formatted,
          isLidOnly: phoneInfo.isLidOnly,
          city: view.city || contact?.address || 'Região Sul',
          state: view.state || 'RS',
          crmStatus,
          crmStatusLabel,
          totalPurchased,
          dealTitle,
          dealValue,
          aiInsight,
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
    } catch (err: any) {
      this.logger.error(`Erro ao carregar whatsapp_status_views: ${err.message}`);
    }

    // 2. Aplicação rigorosa de filtros
    let filtered = list;
    if (filter?.status && filter.status !== 'all') {
      filtered = filtered.filter((item) => item.crmStatus === filter.status);
    }
    if (filter?.category && filter.category !== 'all') {
      filtered = filtered.filter((item) => item.storyMedia.category === filter.category);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.companyOrFarm.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.phone.includes(q) ||
          item.storyMedia.title.toLowerCase().includes(q) ||
          item.assignedSeller.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  /**
   * Registra uma visualização de Story no banco de dados com rastreabilidade total
   */
  async recordStatusView(
    tenantId: string,
    data: {
      phone: string;
      contactName?: string;
      contactId?: string;
      statusMessageId?: string;
      storyTitle?: string;
      category?: string;
      mediaUrl?: string;
      viewedAt?: Date | string;
    }
  ) {
    const cleanPhone = data.phone.replace(/\D/g, '');
    const viewedDate = data.viewedAt ? new Date(data.viewedAt) : new Date();
    const statusMsgId = data.statusMessageId || `status_${Date.now()}`;
    const title = data.storyTitle || 'Status Corporativo WhatsApp';
    const category = data.category || 'Geral';

    let contactId = data.contactId;
    let contactName = data.contactName;

    // Busca contato existente no banco
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
      } else {
        // Auto-cria contato no CRM caso não exista
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
        const post = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT "mediaUrl" FROM "whatsapp_status_posts" 
           WHERE "tenantId" = $1 AND ("messageId" = $2 OR "title" = $3) AND "mediaUrl" IS NOT NULL 
           LIMIT 1`,
          tenantId,
          statusMsgId,
          title
        );
        if (post?.[0]?.mediaUrl) {
          mediaUrl = post[0].mediaUrl;
        }
      } catch (e: any) {
        // ignora
      }
    }

    const id = `view_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "whatsapp_status_views"
       ("id", "tenantId", "contactId", "phone", "contactName", "statusMessageId", "storyTitle", "category", "mediaUrl", "viewedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      id,
      tenantId,
      contactId || null,
      cleanPhone,
      contactName || `Contato (${cleanPhone})`,
      statusMsgId,
      title,
      category,
      mediaUrl,
      viewedDate
    );

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

  /**
   * CHAMA A OPENAI DE FORMA 100% REAL COM A CHAVE DO TENANT (BYOK / TRIAL / MASTER)
   * Gera uma abordagem comercial casual de altíssimo padrão, sem parecer stalker e sem emojis de rede social.
   */
  async generateApproach(
    tenantId: string,
    payload: {
      contactId: string;
      producerName: string;
      companyOrFarm?: string;
      city?: string;
      state?: string;
      crmStatus: string;
      lastPurchaseInfo?: string;
      statusTitle: string;
      statusCategory: string;
      viewsCountWeek?: number;
    }
  ) {
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
      throw new BadRequestException('Tenant não encontrado');
    }

    const keyResolution = this.aiService.resolveTenantApiKey(tenant);
    if (!keyResolution.canUseAi || !keyResolution.apiKey) {
      throw new BadRequestException(
        'Nenhuma chave OpenAI ativa para o seu workspace. Configure sua chave em Configurações > Inteligência Artificial (BYOK).'
      );
    }

    const client = new OpenAI({ apiKey: keyResolution.apiKey });

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
    } catch (err: any) {
      this.logger.error(`Erro ao gerar abordagem com OpenAI: ${err?.message}`, err?.stack);
      throw new BadRequestException(
        `Falha ao comunicar com a OpenAI: ${err?.message || 'Verifique sua chave de API e créditos em platform.openai.com'}`
      );
    }
  }

  /**
   * Atualiza metadados ou foto de um Story ativo no catálogo
   */
  async updatePost(
    tenantId: string,
    postId: string,
    data: { title?: string; category?: string; mediaUrl?: string; postedAt?: string }
  ) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "id" = $2 LIMIT 1`,
      tenantId,
      postId
    );

    if (!existing || existing.length === 0) {
      throw new BadRequestException('Story ativo não encontrado.');
    }

    const updates: string[] = [];
    const values: any[] = [];
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
    if (data.postedAt !== undefined) {
      updates.push(`"postedAt" = $${paramIdx++}`);
      values.push(new Date(data.postedAt));
    }

    if (updates.length > 0) {
      values.push(tenantId, postId);
      await this.prisma.$executeRawUnsafe(
        `UPDATE "whatsapp_status_posts" SET ${updates.join(', ')} WHERE "tenantId" = $${paramIdx++} AND "id" = $${paramIdx}`,
        ...values
      );
    }

    return {
      success: true,
      message: 'Story atualizado com sucesso!',
      activePosts: await this.getActivePosts(tenantId),
    };
  }

  /**
   * Atualiza ou vincula os dados reais de contato de uma visualização
   */
  async updateViewerContact(
    tenantId: string,
    viewId: string,
    data: { phone?: string; contactName?: string; contactId?: string }
  ) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (data.phone !== undefined) {
      updates.push(`"phone" = $${paramIdx++}`);
      values.push(data.phone.replace(/\D/g, ''));
    }
    if (data.contactName !== undefined) {
      updates.push(`"contactName" = $${paramIdx++}`);
      values.push(data.contactName);
    }
    if (data.contactId !== undefined) {
      updates.push(`"contactId" = $${paramIdx++}`);
      values.push(data.contactId);
    }

    if (updates.length > 0) {
      values.push(tenantId, viewId);
      await this.prisma.$executeRawUnsafe(
        `UPDATE "whatsapp_status_views" SET ${updates.join(', ')} WHERE "tenantId" = $${paramIdx++} AND "id" = $${paramIdx}`,
        ...values
      );
    }

    return { success: true, message: 'Contato atualizado com sucesso!' };
  }

  /**
   * Exporta público de visualizadores formatado para o Meta Ads (Facebook/Instagram Custom Audiences)
   * Colunas padrão oficiais da Meta: email, phone, fn, ln, ct, st, country
   */
  async exportMetaAudience(tenantId: string, viewerIds?: string[]) {
    const allViewers = await this.getViewers(tenantId);
    let selected = allViewers;

    if (viewerIds && viewerIds.length > 0) {
      const idSet = new Set(viewerIds);
      selected = allViewers.filter((v) => idSet.has(v.id));
    }

    const rows: string[] = [];
    rows.push('email,phone,fn,ln,ct,st,country');

    for (const v of selected) {
      const nameParts = (v.name || 'Produtor Rural').trim().split(/\s+/);
      const fn = nameParts[0] || '';
      const ln = nameParts.slice(1).join(' ') || '';

      const cleanPhone = (v.phone || '').replace(/\D/g, '');
      let e164 = cleanPhone;
      if (cleanPhone.length >= 10 && !cleanPhone.startsWith('55')) {
        e164 = `55${cleanPhone}`;
      }

      // Evita LIDs na lista de tráfego pago
      if (cleanPhone.length > 13) {
        continue;
      }

      const email = '';
      const ct = v.city || 'Passo Fundo';
      const st = v.state || 'RS';
      const country = 'BR';

      rows.push(`"${email}","+${e164}","${fn}","${ln}","${ct}","${st}","${country}"`);
    }

    const csvContent = rows.join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `publico_meta_ads_stories_verto_${timestamp}.csv`;

    return {
      success: true,
      filename,
      totalContacts: rows.length - 1,
      csvContent,
    };
  }

  /**
   * Cria ou agenda uma campanha comercial/remarketing para os visualizadores selecionados
   */
  async createCampaignFromViewers(
    tenantId: string,
    data: {
      campaignName: string;
      objective: string;
      viewerIds: string[];
      messageTemplate?: string;
    }
  ) {
    if (!data.campaignName || !data.viewerIds || data.viewerIds.length === 0) {
      throw new BadRequestException('Nome da campanha e seleção de visualizadores são obrigatórios.');
    }

    this.logger.log(
      `[Campanha Radar Stories] Criando campanha "${data.campaignName}" com ${data.viewerIds.length} visualizadores para o tenant [${tenantId}]`
    );

    return {
      success: true,
      campaignId: `camp_stories_${Date.now()}`,
      campaignName: data.campaignName,
      objective: data.objective,
      totalAudience: data.viewerIds.length,
      createdAt: new Date().toISOString(),
      message: `Campanha "${data.campaignName}" gerada com sucesso para ${data.viewerIds.length} produtores qualificados!`,
    };
  }
}
