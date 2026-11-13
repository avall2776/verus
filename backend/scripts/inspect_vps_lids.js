const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    async function run() {
      const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
      
      // Contatos com lid ou números estranhos ou recentes
      const contacts = await prisma.contact.findMany({
        where: {
          tenantId,
          OR: [
            { phone: { contains: 'lid' } },
            { phone: { startsWith: '17' } },
            { phone: { startsWith: '69' } },
            { phone: { startsWith: '78' } },
            { phone: { startsWith: '15' } },
            { whatsappLid: { not: null } }
          ]
        },
        select: { id: true, name: true, phone: true, whatsappLid: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 30
      });
      console.log('--- CONTATOS COM LID / ATUALIZADOS RECENTEMENTE ---');
      console.log(JSON.stringify(contacts, null, 2));

      // Últimas 10 mensagens recebidas/enviadas
      const lastMessages = await prisma.message.findMany({
        where: {
          conversation: { tenantId }
        },
        select: {
          id: true,
          content: true,
          fromMe: true,
          createdAt: true,
          contact: { select: { id: true, name: true, phone: true, whatsappLid: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      console.log('--- ULTIMAS 10 MENSAGENS ---');
      console.log(JSON.stringify(lastMessages, null, 2));

      await prisma.$disconnect();
    }
    run().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code) => {
      console.log('OUTPUT:\n' + out);
      conn.end();
    }).on('data', d => out += d).stderr.on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
