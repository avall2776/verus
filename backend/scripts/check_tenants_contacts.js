const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true }
  });
  console.log('Tenants:', tenants);

  const contactTenantCounts = await prisma.contact.groupBy({
    by: ['tenantId'],
    _count: true
  });
  console.log('Contacts by tenantId:', contactTenantCounts);

  await prisma.$disconnect();
}
main().catch(console.error);

