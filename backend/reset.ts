import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.conversation.updateMany({
    data: { status: 'bot_active' }
  });
  console.log('Todas as conversas resetadas para bot_active');
}

main().finally(() => prisma.$disconnect());
