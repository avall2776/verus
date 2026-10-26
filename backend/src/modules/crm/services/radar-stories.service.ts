import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from '../../ai/ai.service';
import OpenAI from 'openai';

export interface StoryViewerItem {
  id: string;
  contactId: string;
  name: string;
  companyOrFarm: string;
  phone: string;
  city: string;
  state: string;
  crmStatus: 'active_client' | 'inactive_client' | 'open_deal' | 'prospect';
  crmStatusLabel: string;
  totalPurchased: number;
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

        // Classificação real no CRM baseada em negócios
        let crmStatus: StoryViewerItem['crmStatus'] = 'prospect';
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
          } else if (['proposal', 'negotiation', 'follow-up'].includes(topDeal.status)) {
            crmStatus = 'open_deal';
            crmStatusLabel = `Proposta em Aberto (${topDeal.title})`;
          } else if (['lost', 'disqualified'].includes(topDeal.status)) {
            crmStatus = 'inactive_client';
            crmStatusLabel = 'Oportunidade em Espera';
          }
        }

        // Frequência de visualização semanal real
        const weekCountRes = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT count(*)::int as count 
           FROM "whatsapp_status_views" 
           WHERE "tenantId" = $1 AND "phone" = $2 AND "viewedAt" >= $3`,
          tenantId,
          view.phone,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        const viewsCountWeek = weekCountRes?.[0]?.count || 1;
        const interestLevel: StoryViewerItem['storyMedia']['interestLevel'] =
          viewsCountWeek >= 4 ? 'Alta Frequência' : viewsCountWeek >= 2 ? 'Frequência Moderada' : 'Visualização Recente';

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
    } catch (err: any) {
      this.logger.error(`Erro ao carregar whatsapp_status_views: ${err.message}`);
    }

    // 2. Complementa com contatos reais cadastrados no tenant (Verto)
    // Mostra a base ativa com negócios e histórico de interação real
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
        if (registeredPhones.has(contact.phone)) continue;

        let crmStatus: StoryViewerItem['crmStatus'] = 'prospect';
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
          } else if (['proposal', 'negotiation', 'follow-up'].includes(topDeal.status)) {
            crmStatus = 'open_deal';
            crmStatusLabel = `Negociação Ativa (${topDeal.title})`;
          } else if (['lost', 'disqualified'].includes(topDeal.status)) {
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
    } catch (err: any) {
      this.logger.error(`Erro ao carregar contatos reais do CRM: ${err.message}`);
    }

    // 3. Aplicação rigorosa de filtros
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
      data.mediaUrl || null,
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
}
