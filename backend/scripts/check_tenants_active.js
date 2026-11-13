const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTenants() {
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true },
    select: { id: true, name: true, logoUrl: true },
    orderBy: { name: 'asc' }
  });
  console.log('Empresas ativas cadastradas:', JSON.stringify(tenants, null, 2));
  await prisma.$disconnect();
}

checkTenants().catch(console.error);

