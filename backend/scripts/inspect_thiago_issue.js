const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BUSCANDO MENSAGEM RECEBIDA HOJE (07/11/2026) ---');
  const today = new Date('2026-11-07T00:00:00.000Z');
  const msgs = await prisma.message.findMany({
    where: {
      createdAt: { gte: today }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      contact: true,
      conversation: {
        include: {
          contact: true
        }
      }
    }
  });

  console.log(`Encontradas ${msgs.length} mensagens criadas hoje:`);
  for (const m of msgs) {
    console.log({
      msgId: m.id,
      providerMessageId: m.providerMessageId,
      createdAt: m.createdAt,
      content: m.content?.substring(0, 80),
      msgContactId: m.contactId,
      msgContactName: m.contact?.name,
      msgContactPhone: m.contact?.phone,
      convId: m.conversationId,
      convContactId: m.conversation?.contactId,
      convContactName: m.conversation?.contact?.name,
      convContactPhone: m.conversation?.contact?.phone
    });
  }

  console.log('\n--- TODOS CONTATOS COM THIAGO OU 997777766 OU 92734866 ---');
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Thiago', mode: 'insensitive' } },
        { phone: { contains: '997777766' } },
        { phone: { contains: '97777766' } },
        { phone: { contains: '92734866' } }
      ]
    },
    include: {
      conversations: {
        select: { id: true, status: true, updatedAt: true }
      }
    }
  });

  for (const c of contacts) {
    console.log({
      id: c.id,
      name: c.name,
      phone: c.phone,
      whatsappLid: c.whatsappLid,
      avatarUrl: c.avatarUrl?.substring(0, 60),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      conversations: c.conversations
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
