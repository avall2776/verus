const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({
    where: { email: 'volponi.marketing@gmail.com' },
    include: { tenant: true }
  });
  console.log('User found:', user);
  await prisma.$disconnect();
}
check();
