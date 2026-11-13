const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' },
    include: {
      users: {
        include: {
          user: true
        }
      }
    }
  });
  console.log('DEPARTMENTS DE VERTO:');
  depts.forEach(d => {
    console.log(`- Depto: "${d.name}" (ID: ${d.id}):`);
    d.users.forEach(u => console.log(`   * ${u.user.name} (${u.user.email})`));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

