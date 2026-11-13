const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c1 = await prisma.contact.findUnique({ where: { id: 'd598b0aa-0603-44ad-bbbe-a0a4c6b97c3c' } });
  const c2 = await prisma.contact.findUnique({ where: { id: 'aa630430-e411-46c5-887d-45f516ecb457' } });
  console.log('c1 (msg_contact):', c1);
  console.log('c2 (conv_contact):', c2);

  // How many messages have msg.contactId != conv.contactId in total across the database?
  const count = await prisma.$queryRaw`
    SELECT count(*)::int as total
    FROM "Message" m
    JOIN "Conversation" c ON m."conversationId" = c.id
    WHERE m."contactId" != c."contactId";
  `;
  console.log('Total de mensagens com contactId != conv.contactId:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());

