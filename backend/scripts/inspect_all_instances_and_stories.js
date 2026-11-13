const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('=== TENANTS ===');
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true }
  });
  console.log(tenants);

  console.log('\n=== WHATSAPP INSTANCES ===');
  const instances = await prisma.whatsAppInstance.findMany();
  for (const inst of instances) {
    console.log({
      id: inst.id,
      name: inst.name,
      tenantId: inst.tenantId,
      status: inst.status,
      phone: inst.phoneNumber,
      isDefault: inst.isDefault,
      settings: inst.settings
    });
  }

  console.log('\n=== WHATSAPP STATUS POSTS ===');
  const posts = await prisma.$queryRawUnsafe(`SELECT * FROM "whatsapp_status_posts" ORDER BY "postedAt" DESC LIMIT 10`);
  console.log(posts);

  console.log('\n=== WHATSAPP STATUS VIEWS (TOP 10) ===');
  const views = await prisma.$queryRawUnsafe(`SELECT * FROM "whatsapp_status_views" ORDER BY "viewedAt" DESC LIMIT 10`);
  console.log(views);
}

main().catch(console.error).finally(() => prisma.$disconnect());
