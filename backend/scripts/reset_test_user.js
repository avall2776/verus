const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: { equals: 'administrativoavall@gmail.com', mode: 'insensitive' } },
    data: { failedLoginAttempts: 0, lockedUntil: null }
  });
  console.log('Tentativas resetadas para 0.');
  await prisma.$disconnect();
}

main().catch(console.error);

