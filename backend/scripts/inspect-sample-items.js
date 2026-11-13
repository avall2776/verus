require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const items = await prisma.quickReply.findMany({
    where: {
      tenantId,
      OR: [
        { shortcut: { contains: 'apresentacao' } },
        { shortcut: { contains: 'caixa' } },
        { shortcut: { contains: 'escarificador' } },
      ],
    },
    select: { shortcut: true, title: true, fileName: true, mediaUrl: true, type: true, content: true },
  });

  console.log('Results:');
  for (const i of items) {
    console.log(JSON.stringify(i, null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

