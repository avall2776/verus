const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRawUnsafe(`
    SELECT id, "tenantId", title, category, "mediaType", 
           CASE WHEN "mediaUrl" IS NULL THEN 'NULL' ELSE SUBSTRING("mediaUrl", 1, 60) END as preview,
           LENGTH(COALESCE("mediaUrl", '')) as len,
           "postedAt"
    FROM "whatsapp_status_posts"
    ORDER BY "postedAt" DESC LIMIT 5;
  `);
  console.log('LATEST POSTS:', posts);
}

main().catch(console.error).finally(() => prisma.$disconnect());

