const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO CONVERSAS TEMPORÁRIAS LID DE GERSON E ANTÔNIO ===');

  const gersonConv = await prisma.conversation.findUnique({
    where: { id: 'c1b01da1-f28b-4ce9-be8d-6d606a3c5dbe' },
    include: {
      contact: true,
      messages: { select: { id: true, content: true, createdAt: true } }
    }
  });
  console.log('Gerson temp conv:', gersonConv?.contact?.name, gersonConv?.contact?.phone);
  for (const m of gersonConv?.messages || []) {
    console.log(`  [${m.createdAt.toISOString()}] ${m.content?.substring(0, 60)}`);
  }

  const antonioConv = await prisma.conversation.findUnique({
    where: { id: 'c8405972-3eb8-4d79-af7f-4de101dd7aa4' },
    include: {
      contact: true,
      messages: { select: { id: true, content: true, createdAt: true } }
    }
  });
  console.log('\nAntônio temp conv:', antonioConv?.contact?.name, antonioConv?.contact?.phone);
  for (const m of antonioConv?.messages || []) {
    console.log(`  [${m.createdAt.toISOString()}] ${m.content?.substring(0, 60)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

