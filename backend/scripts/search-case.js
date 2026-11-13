require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const items = await prisma.quickReply.findMany({
    where: {
      tenantId,
      OR: [
        { shortcut: { contains: 'case', mode: 'insensitive' } },
        { title: { contains: 'case', mode: 'insensitive' } },
        { fileName: { contains: 'case', mode: 'insensitive' } },
        { content: { contains: 'case', mode: 'insensitive' } },
        { shortcut: { contains: 'riser', mode: 'insensitive' } },
        { title: { contains: 'riser', mode: 'insensitive' } },
        { shortcut: { contains: 'eazy', mode: 'insensitive' } },
        { shortcut: { contains: 'fast', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`Matching items: ${items.length}`);
  for (const it of items) {
    console.log(`- ${it.shortcut} | ${it.title} | ${it.fileName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

