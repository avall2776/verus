const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRawUnsafe(`
    SELECT id, "tenantId", "messageId", title, category, "mediaType", "postedAt",
           length("mediaUrl") as media_len
    FROM "whatsapp_status_posts"
    ORDER BY "postedAt" DESC
  `);
  console.log(posts);
  await prisma.$disconnect();
}
main().catch(console.error);

