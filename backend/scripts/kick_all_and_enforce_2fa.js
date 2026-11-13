const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function kickAllAndEnforce2FA() {
  console.log('--- INICIANDO DERRUBADA GLOBAL DE SESSÕES & ENFORCEMENT 2FA ---');

  try {
    // 1. Encerra todas as sessões ativas no banco
    const revokedSessions = await prisma.activeSession.updateMany({
      where: { isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
    console.log(`[1] Sessões ativas encerradas no SOC: ${revokedSessions.count}`);

    // 2. Limpa dispositivos confiáveis e ativa 2FA Master para TODOS os usuários
    const updatedUsers = await prisma.user.updateMany({
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: 'WHATSAPP',
        twoFactorPhone: '555491109159',
        trustedDevices: [],
      },
    });
    console.log(`[2] Usuários com 2FA WhatsApp Master ativado: ${updatedUsers.count}`);

    // 3. Exclui verificações 2FA antigas/pendentes
    const deleted2fa = await prisma.twoFactorVerification.deleteMany({});
    console.log(`[3] Códigos 2FA pendentes/antigos limpos: ${deleted2fa.count}`);

    console.log('--- SUCESSO: Todas as sessões foram derrubadas e todos os usuários foram obrigados a passar por 2FA via WhatsApp Master ---');
  } catch (err) {
    console.error('Erro ao executar derrubada global:', err);
  } finally {
    await prisma.$disconnect();
  }
}

kickAllAndEnforce2FA();

