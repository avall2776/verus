const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Ernesto', mode: 'insensitive' } },
        { phone: { contains: '1736800' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            take: 3,
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });
  console.log('ENCONTRADOS:', contacts.length);
  for (const c of contacts) {
    console.log('ID:', c.id);
    console.log('Nome:', c.name);
    console.log('Phone:', c.phone);
    console.log('WhatsappLid:', c.whatsappLid);
    console.log('AvatarUrl:', c.avatarUrl);
    console.log('TenantId:', c.tenantId);
    console.log('Conversations:', c.conversations.map(conv => ({ id: conv.id, status: conv.status, unreadCount: conv.unreadCount })));
    for (const conv of c.conversations) {
      console.log('  Messages:', conv.messages.map(m => ({
        id: m.id,
        direction: m.direction,
        senderType: m.senderType,
        providerMessageId: m.providerMessageId,
        content: m.content.substring(0, 50)
      })));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
