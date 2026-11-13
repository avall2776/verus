const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRawUnsafe(
    'SELECT id, "tenantId", "messageId", title, category, "mediaUrl", "postedAt" FROM "whatsapp_status_posts" ORDER BY "postedAt" DESC LIMIT 10;'
  );
  console.log('STATUS POSTS IN DB:', posts);

  const views = await prisma.$queryRawUnsafe(
    'SELECT id, "tenantId", "contactId", phone, "contactName", "statusMessageId", "storyTitle", category, "mediaUrl", "viewedAt" FROM "whatsapp_status_views" ORDER BY "viewedAt" DESC LIMIT 10;'
  );
  console.log('STATUS VIEWS IN DB:', views);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
