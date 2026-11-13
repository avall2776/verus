const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function test() {
      const tenant = await prisma.tenant.findFirst();
      const t0 = Date.now();
      const convs = await prisma.conversation.findMany({
        where: { tenantId: tenant.id },
        take: 100,
        orderBy: { updatedAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } }
        }
      });
      const t1 = Date.now();
      console.log('Conversas carregadas:', convs.length, 'em', (t1 - t0), 'ms');
      await prisma.$disconnect();
    }
    test();
  `;

  conn.exec(`node -e "${code.replace(/\n/g, ' ')}"`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

