const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true }
  });
  console.log('TENANTS:', tenants);

  const posts = await prisma.$queryRawUnsafe(`
    SELECT p.id, p."tenantId", t.name as "tenantName", p."messageId", p.title, p.category, 
           CASE WHEN p."mediaUrl" IS NULL THEN 'NULL' ELSE SUBSTRING(p."mediaUrl", 1, 50) END as "mediaPreview", 
           p."postedAt"
    FROM "whatsapp_status_posts" p
    LEFT JOIN "Tenant" t ON t.id = p."tenantId"
    WHERE p."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
    ORDER BY p."postedAt" DESC;
  `);
  console.log('POSTS WITH TENANTS:', posts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
