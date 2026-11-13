const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  const instances = await prisma.whatsAppInstance.findMany({
    where: { tenantId }
  });
  console.log('INSTANCES FOR VERTO:');
  instances.forEach(i => {
    console.log({
      id: i.id,
      name: i.name,
      phoneNumber: i.phoneNumber,
      status: i.status,
      settings: i.settings,
      updatedAt: i.updatedAt
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
