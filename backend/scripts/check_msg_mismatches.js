const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO INCONSISTÊNCIAS DE CONTACT_ID EM MENSAGENS ===');

  const mismatches = await prisma.$queryRaw`
    SELECT m.id, m."conversationId", m."contactId" as msg_contact, c."contactId" as conv_contact, m.content, m."createdAt"
    FROM "Message" m
    JOIN "Conversation" c ON m."conversationId" = c.id
    WHERE m."contactId" != c."contactId"
    LIMIT 50;
  `;

  console.log('Mensagens com contactId diferente da conversa:', mismatches);
}

main().catch(console.error).finally(() => prisma.$disconnect());

