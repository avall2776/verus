require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const items = await prisma.quickReply.findMany({
    where: { tenantId },
    select: {
      id: true,
      shortcut: true,
      title: true,
      fileName: true,
      type: true,
      content: true,
      mediaUrl: true,
    },
    orderBy: { shortcut: 'asc' },
  });

  console.log(`Total items: ${items.length}\n`);
  for (const it of items) {
    console.log(`[${it.type}] ${it.shortcut} | "${it.title}" | file: ${it.fileName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

