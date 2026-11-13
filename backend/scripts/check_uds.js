const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const uds = await prisma.userDepartment.findMany({
    include: {
      user: true,
      department: true
    }
  });
  console.log('USER DEPARTMENTS:', uds.map(ud => ({
    user: ud.user.name,
    email: ud.user.email,
    tenantId: ud.user.tenantId,
    department: ud.department.name
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());

