const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findFelipe() {
  const users = await prisma.user.findMany({
    include: { tenant: true }
  });
  console.log('All Users in DB:');
  for (const u of users) {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Tenant: ${u.tenant?.name} (${u.tenantId})`);
  }
  await prisma.$disconnect();
}

findFelipe().catch(console.error);
