const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.message.findMany({
    where: {
      content: { contains: 'Olá' },
      createdAt: { gte: new Date('2026-11-03T00:00:00Z') }
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      conversation: {
        include: {
          contact: true,
        }
      }
    }
  });

  console.log(JSON.stringify(msgs, null, 2));

  await prisma.$disconnect();
}
main().catch(console.error);

