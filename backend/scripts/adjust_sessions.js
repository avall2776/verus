const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function adjust() {
  // Reativa exclusivamente a sessão do SuperAdmin atual para ele não cair da tela
  await prisma.activeSession.updateMany({
    where: { id: '92c896d4-9366-4bab-a2e3-5e6746ec0ee0' },
    data: { isRevoked: false, revokedAt: null },
  });

  // Garante que todas as outras possíveis sessões estejam revogadas
  await prisma.activeSession.updateMany({
    where: { id: { not: '92c896d4-9366-4bab-a2e3-5e6746ec0ee0' } },
    data: { isRevoked: true, revokedAt: new Date() },
  });

  // Garante 2FA obrigatório para todos
  await prisma.user.updateMany({
    data: {
      twoFactorEnabled: true,
      twoFactorPhone: '555491109159',
      twoFactorMethod: 'WHATSAPP',
    },
  });

  console.log('Sessão do SuperAdmin preservada. Todas as demais bloqueadas/revogadas.');
  await prisma.$disconnect();
}

adjust();

