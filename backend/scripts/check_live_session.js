const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sessions = await prisma.activeSession.findMany({
    include: { user: { select: { email: true, name: true } } },
  });
  console.log('Total sessions in DB:', sessions.length);
  sessions.forEach((s) => {
    console.log(`Session ${s.id} | User: ${s.user.email} (${s.user.name}) | Revoked: ${s.isRevoked} | Token: ${s.sessionToken?.slice(0, 20)}...`);
  });
  await prisma.$disconnect();
}

check();
