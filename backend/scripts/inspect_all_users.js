const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== TODOS OS USUÁRIOS NO BANCO ===');
  const allUsers = await prisma.user.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        }
      },
      departments: {
        include: {
          department: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Total de usuários encontrados: ${allUsers.length}`);
  allUsers.forEach(u => {
    console.log({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      tenantId: u.tenantId,
      tenantName: u.tenant?.name,
      departments: u.departments.map(d => d.department.name),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    });
  });

  console.log('\n=== TODOS OS TENANTS ===');
  const allTenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          users: true,
          contacts: true,
          conversations: true,
        }
      }
    }
  });
  console.log(JSON.stringify(allTenants, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
