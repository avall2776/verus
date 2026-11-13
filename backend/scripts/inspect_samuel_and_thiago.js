const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO CONVERSA DE SAMUEL ===');
  const conv = await prisma.conversation.findUnique({
    where: { id: '143b1a46-6c0e-4164-92d7-32c3cfdc8651' },
    include: {
      contact: true,
      messages: {
        select: { id: true, contactId: true, fromMe: true, content: true, createdAt: true }
      }
    }
  });

  console.log('Conversa contact:', conv?.contact?.name, conv?.contact?.phone);
  console.log('Total msgs:', conv?.messages.length);
  const byContact = {};
  for (const m of conv?.messages || []) {
    byContact[m.contactId] = (byContact[m.contactId] || 0) + 1;
  }
  console.log('Distribuição por contactId:', byContact);

  console.log('\n=== VERIFICANDO CONVERSA DE THIAGO SANTOS ===');
  const conv2 = await prisma.conversation.findUnique({
    where: { id: 'e81b0bc8-2792-4638-9504-caf7c5f5658f' },
    include: {
      contact: true,
      messages: {
        select: { id: true, contactId: true, fromMe: true, content: true, createdAt: true }
      }
    }
  });
  console.log('Conversa 2 contact:', conv2?.contact?.name, conv2?.contact?.phone);
  console.log('Total msgs:', conv2?.messages.length);
  const byContact2 = {};
  for (const m of conv2?.messages || []) {
    byContact2[m.contactId] = (byContact2[m.contactId] || 0) + 1;
  }
  console.log('Distribuição por contactId:', byContact2);
}

main().catch(console.error).finally(() => prisma.$disconnect());
