const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const views = await prisma.$queryRawUnsafe(`
    SELECT id, "statusMessageId", "storyTitle", category, "viewedAt", phone, "contactName"
    FROM "whatsapp_status_views"
    WHERE "tenantId" = $1 AND "storyTitle" = 'Status Comercial WhatsApp'
    ORDER BY "viewedAt" DESC;
  `, tenantId);
  console.log('STATUS COMERCIAL WHATSAPP VIEWS IN VERTO:', views);
}

main().catch(console.error).finally(() => prisma.$disconnect());

