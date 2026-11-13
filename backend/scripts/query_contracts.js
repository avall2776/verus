const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Contracts in database:');
  console.log(JSON.stringify(contracts, null, 2));

  const target = await prisma.contract.findFirst({
    where: {
      code: { contains: '4955', mode: 'insensitive' }
    }
  });
  console.log('\nTarget contract 4955:', target);
}

main().catch(console.error).finally(() => prisma.$disconnect());

