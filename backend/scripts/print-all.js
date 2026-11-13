require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const items = await prisma.quickReply.findMany({
    where: { tenantId },
    select: { shortcut: true, title: true, fileName: true, type: true },
    orderBy: { shortcut: 'asc' },
  });

  console.log('--- ALL SHORTCUTS AND TITLES ---');
  for (const it of items) {
    console.log(`${it.shortcut.padEnd(45)} | ${it.title}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

