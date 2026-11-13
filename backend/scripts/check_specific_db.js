const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    async function run() {
      const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
      const res = await prisma.contact.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: 'Marlon' } },
            { name: { contains: 'Lucas Silva' } },
            { name: { contains: 'Evelin' } },
            { name: { contains: 'Paulo Roberto' } },
            { name: { contains: 'Nivaldo' } }
          ]
        },
        select: { id: true, name: true, phone: true, whatsappLid: true, updatedAt: true }
      });
      console.log(JSON.stringify(res, null, 2));
      await prisma.$disconnect();
    }
    run().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    let out = '';
    stream.on('close', () => {
      console.log('STATUS CONTATOS:\n' + out);
      conn.end();
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
