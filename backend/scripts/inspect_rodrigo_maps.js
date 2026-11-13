const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const contacts = await prisma.contact.findMany({
    where: {
      name: { contains: 'Rodrigo Trojan', mode: 'insensitive' }
    }
  });
  console.log('Found contacts:', contacts.length);
  for (const c of contacts) {
    console.log('Contact:', c.id, c.name, c.remoteJid, c.tenantId);
    const msgs = await prisma.message.findMany({
      where: {
        OR: [
          { content: { contains: 'maps' } },
          { remoteJid: c.remoteJid }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 4
    });
    console.log('Msgs for', c.name, ':', msgs.map(m => ({ id: m.id, content: m.content, type: m.type, mediaUrl: m.mediaUrl, createdAt: m.createdAt })));
  }

  // Also search messages directly containing 'GKZUTGkkUYQYUbmb6'
  const mapsMsgs = await prisma.message.findMany({
    where: {
      content: { contains: 'GKZUTG' }
    }
  });
  console.log('Direct maps msgs:', mapsMsgs);
}

run().catch(console.error).finally(() => prisma.$disconnect());
