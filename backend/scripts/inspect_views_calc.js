const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  
  const postsWithViews = await prisma.$queryRawUnsafe(`
    SELECT p.id, p."messageId", p.title, p."postedAt",
           COUNT(v.id)::int as raw_views_count,
           COUNT(DISTINCT v.phone)::int as distinct_phones_total,
           COUNT(DISTINCT v.phone) FILTER (
             WHERE v."viewedAt" >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo'
           )::int as distinct_phones_today
    FROM "whatsapp_status_posts" p
    LEFT JOIN "whatsapp_status_views" v 
      ON (v."tenantId" = p."tenantId" AND (v."statusMessageId" = p."messageId" OR (v."storyTitle" = p."title" AND v."viewedAt" >= p."postedAt")))
    WHERE p."tenantId" = $1
    GROUP BY p.id
    ORDER BY p."postedAt" DESC;
  `, tenantId);
  console.log('POSTS WITH VIEWS JOIN:', postsWithViews);

  const allViewsCount = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int as total_views, COUNT(DISTINCT phone)::int as distinct_phones
    FROM "whatsapp_status_views"
    WHERE "tenantId" = $1;
  `, tenantId);
  console.log('ALL VIEWS FOR TENANT:', allViewsCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

