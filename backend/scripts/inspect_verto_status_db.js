const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  console.log('--- POSTS FOR VERTO ---');
  const cols = await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'whatsapp_status_posts'`
  );
  console.log(cols);
  const posts = await prisma.$queryRawUnsafe(
    `SELECT id, title, category, "postedAt" FROM "whatsapp_status_posts" WHERE "tenantId" = $1 ORDER BY "postedAt" DESC`,
    tenantId
  );
  console.log(posts);

  console.log('--- VIEWS FOR VERTO ---');
  const views = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int as total, "statusMessageId", "storyTitle" 
     FROM "whatsapp_status_views" 
     WHERE "tenantId" = $1 
     GROUP BY "statusMessageId", "storyTitle"`,
    tenantId
  );
  console.log(views);
}

main().catch(console.error).finally(() => prisma.$disconnect());
