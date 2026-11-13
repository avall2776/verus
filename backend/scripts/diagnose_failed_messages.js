const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. CONTAGEM DE MENSAGENS COM FALHA (ÚLTIMOS 7 DIAS) ===');
  const failedStats = await prisma.message.groupBy({
    by: ['status', 'direction'],
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) }
    },
    _count: { id: true }
  });
  console.log(failedStats);

  console.log('\n=== 2. ÚLTIMAS 25 MENSAGENS COM STATUS "failed" OU "error" ===');
  const failedMessages = await prisma.message.findMany({
    where: {
      status: { in: ['failed', 'error'] },
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) }
    },
    orderBy: { createdAt: 'desc' },
    take: 25,
    include: {
      conversation: {
        include: {
          contact: true,
        }
      }
    }
  });

  console.log(failedMessages.map(m => ({
    id: m.id,
    tenantId: m.tenantId,
    content: m.content?.substring(0, 60),
    type: m.type,
    createdAt: m.createdAt,
    contactName: m.conversation?.contact?.name,
    contactPhone: m.conversation?.contact?.phone,
    senderType: m.senderType,
  })));

  await prisma.$disconnect();
}
main().catch(console.error);

