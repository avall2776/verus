const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const seen = new Set();
  const duplicates = [];

  for (const c of convs) {
    const key = `${c.tenantId}_${c.contactId}`;
    if (seen.has(key)) {
      duplicates.push(c.id);
    } else {
      seen.add(key);
    }
  }

  console.log('Duplicatas a remover:', duplicates);

  if (duplicates.length > 0) {
    // Reatribuir mensagens das duplicatas para a original?
    // Melhor, só deletar porque é ambiente de teste
    await prisma.message.deleteMany({
      where: { conversationId: { in: duplicates } }
    });
    await prisma.conversation.deleteMany({
      where: { id: { in: duplicates } }
    });
    console.log('Duplicatas removidas com sucesso.');
  }
}

main().finally(() => prisma.$disconnect());
