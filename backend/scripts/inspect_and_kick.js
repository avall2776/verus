const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorPhone: true,
        role: true,
      },
    });
    console.log('Total users in DB:', users.length);
    console.log(JSON.stringify(users, null, 2));

    const tenants = await prisma.tenant.findMany({
      select: { id: true, name: true, slug: true },
    });
    console.log('Total tenants in DB:', tenants.length);
    console.log(JSON.stringify(tenants, null, 2));

    const sessions = await prisma.activeSession.findMany();
    console.log('Active sessions in DB:', sessions.length);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

inspect();

