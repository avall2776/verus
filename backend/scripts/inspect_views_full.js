const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  const views = await prisma.$queryRawUnsafe(
    `SELECT id, "contactId", phone, "contactName", "statusMessageId", "storyTitle", "viewedAt" 
     FROM "whatsapp_status_views" 
     WHERE "tenantId" = $1 
     ORDER BY "viewedAt" DESC 
     LIMIT 15`,
    tenantId
  );
  console.log('RECENT VIEWS FOR VERTO:', views);
}

main().catch(console.error).finally(() => prisma.$disconnect());
