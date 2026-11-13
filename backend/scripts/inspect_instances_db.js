const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const instances = await prisma.whatsAppInstance.findMany({
    select: {
      id: true,
      tenantId: true,
      name: true,
      phoneNumber: true,
      status: true,
      isDefault: true,
      tenant: { select: { name: true } }
    }
  });
  console.log('WHATSAPP INSTANCES:', instances);
}

main().catch(console.error).finally(() => prisma.$disconnect());

