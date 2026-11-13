const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  console.log('Tenants:', tenants);

  const instances = await prisma.whatsAppInstance.findMany({
    select: { id: true, name: true, tenantId: true, status: true, phoneNumber: true }
  });
  console.log('Instances:', instances);
}

main().catch(console.error).finally(() => prisma.$disconnect());
