const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 2. Deals com assignedTo
  const dealsWithUsers = await prisma.deal.findMany({
    where: { assignedTo: { not: null } },
    select: { id: true, title: true, assignedTo: true, tenantId: true }
  });
  console.log('Total de deals com assignedTo:', dealsWithUsers.length);
  const dealUserIds = [...new Set(dealsWithUsers.map(d => d.assignedTo))];
  console.log('User IDs únicos em deals:', dealUserIds);
  for (const uid of dealUserIds) {
    const user = await prisma.user.findUnique({ where: { id: uid } });
    console.log(`Deal User ID "${uid}": ${user ? `${user.name} (${user.email}) - Tenant: ${user.tenantId}` : 'NÃO EXISTE NO BANCO (DELETADO!)'}`);
  }

  // 3. Verificar todos os Tenants e quantos usuários cada um tem
  const tenants = await prisma.tenant.findMany({
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }
    }
  });

  console.log('\n=== USUÁRIOS POR TENANT ===');
  tenants.forEach(t => {
    console.log(`Tenant: "${t.name}" (ID: ${t.id}) - Usuários (${t.users.length}):`);
    t.users.forEach(u => console.log(`   - ${u.name} <${u.email}> [${u.role}] (Criado: ${u.createdAt.toISOString()})`));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
