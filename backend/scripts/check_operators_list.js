const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const MASTER_TENANT_ID = 'tenant_123';
  const ops = await prisma.user.findMany({
    where: {
      OR: [
        { tenantId: MASTER_TENANT_ID, isSuperAdmin: false },
        { role: 'AGENT' },
        { role: 'SUPPORT_AGENT' },
        { role: 'SUPPORT_ANALYST' },
        { role: 'SUPPORT_MANAGER' },
      ],
    },
    include: {
      tenant: true
    }
  });

  console.log('OPERATORS NO SUPER ADMIN OPERATORS:', ops.length);
  ops.forEach(o => console.log(o.name, o.email, o.role, o.tenant?.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());

