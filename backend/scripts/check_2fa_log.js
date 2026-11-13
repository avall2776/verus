const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatest2FA() {
  const verifications = await prisma.twoFactorVerification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  console.log('Últimos 2FA gerados no banco:', JSON.stringify(verifications, null, 2));

  const instances = await prisma.whatsAppInstance.findMany({
    select: { id: true, name: true, status: true, tenantId: true, token: true, phoneNumber: true }
  });
  console.log('Instâncias de WhatsApp cadastradas:', JSON.stringify(instances, null, 2));

  await prisma.$disconnect();
}

checkLatest2FA().catch(console.error);

