const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const depts = await prisma.department.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' },
  });
  console.log(depts);
}

main().catch(console.error).finally(() => prisma.$disconnect());

