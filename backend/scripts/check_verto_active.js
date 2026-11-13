const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const posts = await prisma.$queryRawUnsafe(`
    SELECT p.id, p.title, p."mediaType", length(p."mediaUrl") as media_len, p."postedAt", p."messageId"
    FROM "whatsapp_status_posts" p
    WHERE p."tenantId" = $1 AND p."postedAt" >= $2
    ORDER BY p."postedAt" DESC
  `, tenantId, twentyFourHoursAgo);
  console.log('Active posts for Verto:', posts);
  await prisma.$disconnect();
}
main().catch(console.error);

