const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  console.log('--- LIMPANDO POSTS E VIEWS MOCADOS/CORROMPIDOS DO TENANT VERTO ---');

  // 1. Remove views vinculadas ao post falso da manhã
  const delViews = await prisma.$executeRawUnsafe(
    `DELETE FROM "whatsapp_status_views" 
     WHERE "tenantId" = $1 AND ("statusMessageId" = 'story_msg_20261026_morning' OR "storyTitle" LIKE '%Linha Verto Agro%')`,
    tenantId
  );
  console.log('Views falsas removidas:', delViews);

  // 2. Remove o post falso da manhã
  const delPosts = await prisma.$executeRawUnsafe(
    `DELETE FROM "whatsapp_status_posts" 
     WHERE "tenantId" = $1 AND ("messageId" = 'story_msg_20261026_morning' OR "title" LIKE '%Linha Verto Agro%')`,
    tenantId
  );
  console.log('Posts falsos removidos:', delPosts);

  // 3. Verifica posts restantes
  const remainingPosts = await prisma.$queryRawUnsafe(
    `SELECT id, "messageId", title, category, "mediaUrl", "postedAt" 
     FROM "whatsapp_status_posts" 
     WHERE "tenantId" = $1 
     ORDER BY "postedAt" DESC`,
    tenantId
  );
  console.log('Posts restantes:', remainingPosts);

  // 4. Verifica views restantes
  const remainingViews = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int as total FROM "whatsapp_status_views" WHERE "tenantId" = $1`,
    tenantId
  );
  console.log('Views restantes:', remainingViews);
}

main().catch(console.error).finally(() => prisma.$disconnect());
