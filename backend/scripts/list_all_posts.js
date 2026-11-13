const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRawUnsafe(`
    SELECT p.id, p."tenantId", t.name as "tenantName", p."messageId", p.title, p.category, 
           p."postedAt",
           LENGTH(COALESCE(p."mediaUrl", '')) as "mediaLen"
    FROM "whatsapp_status_posts" p
    LEFT JOIN "Tenant" t ON t.id = p."tenantId"
    ORDER BY p."postedAt" DESC;
  `);
  console.log('ALL POSTS IN DB:', posts);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

