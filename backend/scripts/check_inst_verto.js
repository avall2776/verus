const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inst = await prisma.whatsAppInstance.findUnique({
    where: { id: 'babdc262-ebd6-49ac-938c-d1952c633c98' }
  });
  console.log({
    id: inst.id,
    name: inst.name,
    status: inst.status,
    settings: inst.settings
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

