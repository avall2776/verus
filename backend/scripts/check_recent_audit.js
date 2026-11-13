const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastLogs = await prisma.loginAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  console.log('Últimos registros de auditoria SOC gravados:', JSON.stringify(lastLogs, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);

