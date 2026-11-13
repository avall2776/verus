const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  
  const posts = await prisma.$queryRawUnsafe(`
    SELECT id, "messageId", title, category, "postedAt", 
           CASE WHEN "mediaUrl" IS NULL THEN 'NULL' ELSE SUBSTRING("mediaUrl", 1, 30) END as media
    FROM "whatsapp_status_posts"
    WHERE "tenantId" = $1
    ORDER BY "postedAt" DESC;
  `, tenantId);
  console.log('VERTO POSTS:', posts);

  const viewsCountByMsg = await prisma.$queryRawUnsafe(`
    SELECT "statusMessageId", "storyTitle", COUNT(*)::int as count, MIN("viewedAt") as first_view, MAX("viewedAt") as last_view
    FROM "whatsapp_status_views"
    WHERE "tenantId" = $1
    GROUP BY "statusMessageId", "storyTitle"
    ORDER BY count DESC;
  `, tenantId);
  console.log('VIEWS BY MSG:', viewsCountByMsg);

  const totalViewsToday = await prisma.$queryRawUnsafe(`
    SELECT COUNT(DISTINCT phone)::int as today_count
    FROM "whatsapp_status_views"
    WHERE "tenantId" = $1 AND "viewedAt" >= (NOW() AT TIME ZONE 'America/Sao_Paulo')::date AT TIME ZONE 'America/Sao_Paulo';
  `, tenantId);
  console.log('TODAY UNIQUE VIEWERS:', totalViewsToday);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

