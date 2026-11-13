const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.message.findMany({
    where: {
      tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      conversation: {
        include: {
          contact: true,
        }
      }
    }
  });

  console.log(msgs.map(m => ({
    id: m.id,
    content: m.content,
    direction: m.direction,
    status: m.status,
    senderType: m.senderType,
    createdAt: m.createdAt,
    contactName: m.conversation?.contact?.name,
    contactPhone: m.conversation?.contact?.phone,
  })));

  await prisma.$disconnect();
}
main().catch(console.error);
