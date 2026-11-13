const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simulando o RadarStoriesService
class TestRadar {
  constructor(prisma) {
    this.prisma = prisma;
  }

  formatDateTime(date) {
    const d = new Date(date);
    const nowSpStr = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date());

    const targetSpStr = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(d);

    const timeFormatted = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(d);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySpStr = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(yesterday);

    const diffMinutes = Math.floor((Date.now() - d.getTime()) / (1000 * 60));
    const timeShort = timeFormatted.slice(0, 5);
    let relative = 'Agora';

    if (diffMinutes < 1) {
      relative = 'Agora mesmo';
    } else if (diffMinutes < 60 && nowSpStr === targetSpStr) {
      relative = `Há ${diffMinutes} min`;
    } else if (nowSpStr === targetSpStr) {
      relative = `Hoje às ${timeShort}`;
    } else if (yesterdaySpStr === targetSpStr) {
      relative = `Ontem às ${timeShort}`;
    } else {
      relative = `${targetSpStr.slice(0, 5)} às ${timeShort}`;
    }

    return { dateFormatted: targetSpStr, timeFormatted, relative };
  }

  async getActivePosts(tenantId, mode = 'active') {
    const isHistory = mode === 'history' || mode === 'all';
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const timeFilter = isHistory ? new Date(0) : twentyFourHoursAgo;
    const limit = isHistory ? 100 : 50;

    const posts = await this.prisma.$queryRawUnsafe(
      `SELECT p.*, 
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
       LIMIT $3`,
      tenantId,
      timeFilter,
      limit
    );

    return (posts || []).map((p) => {
      const { dateFormatted, timeFormatted, relative } = this.formatDateTime(p.postedAt);
      return {
        id: p.id,
        tenantId: p.tenantId,
        messageId: p.messageId,
        title: p.title,
        category: p.category,
        mediaUrl: p.mediaUrl ? 'HAS_MEDIA' : null,
        postedAt: p.postedAt,
        postedAtRelative: relative,
        viewsCount: Number(p.viewsTotal) || 0,
        viewsTotal: Number(p.viewsTotal) || 0,
        viewsToday: Number(p.viewsToday) || 0,
      };
    });
  }
}

async function main() {
  const tester = new TestRadar(prisma);
  console.log('=== POSTS FOR VERTO (fc89e34b-2bc5-462d-9bfd-45b06e1d0126) active ===');
  console.log(await tester.getActivePosts('fc89e34b-2bc5-462d-9bfd-45b06e1d0126', 'active'));

  console.log('=== POSTS FOR VERTO history ===');
  console.log(await tester.getActivePosts('fc89e34b-2bc5-462d-9bfd-45b06e1d0126', 'all'));

  console.log('=== POSTS FOR AGENCIA TESTE (c38f8968-ee21-437c-a1b5-f83d0307cb4b) active ===');
  console.log(await tester.getActivePosts('c38f8968-ee21-437c-a1b5-f83d0307cb4b', 'active'));

  console.log('=== POSTS FOR AGENCIA TESTE history ===');
  console.log(await tester.getActivePosts('c38f8968-ee21-437c-a1b5-f83d0307cb4b', 'all'));
}

main().catch(console.error).finally(() => prisma.$disconnect());

