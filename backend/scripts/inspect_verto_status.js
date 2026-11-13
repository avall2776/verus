const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  const posts = await prisma.$queryRawUnsafe(
    'SELECT * FROM "whatsapp_status_posts" WHERE "tenantId" = $1 ORDER BY "postedAt" DESC;',
    tenantId
  );
  console.log('ALL POSTS FOR VERTO:\n', posts.map(p => ({ id: p.id, messageId: p.messageId, title: p.title, postedAt: p.postedAt, mediaUrl: p.mediaUrl ? p.mediaUrl.substring(0, 30) + '...' : null })));

  const views = await prisma.$queryRawUnsafe(
    'SELECT * FROM "whatsapp_status_views" WHERE "tenantId" = $1 ORDER BY "viewedAt" DESC;',
    tenantId
  );
  console.log(`TOTAL VIEWS FOR VERTO: ${views.length}`);
  console.log('SAMPLE VIEWS:', views.slice(0, 5));
}

main().catch(console.error).finally(() => prisma.$disconnect());
