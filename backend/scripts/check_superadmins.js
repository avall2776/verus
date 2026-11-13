const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const superAdmins = await prisma.user.findMany({
    where: {
      OR: [
        { isSuperAdmin: true },
        { role: 'SUPER_ADMIN' }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isSuperAdmin: true,
      twoFactorEnabled: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      tenant: { select: { id: true, name: true } }
    }
  });

  console.log('SuperAdmins cadastrados:', JSON.stringify(superAdmins, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);

