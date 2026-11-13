const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();

    async function check() {
      const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
      
      const genericContacts = await prisma.contact.findMany({
        where: {
          tenantId,
          OR: [
            { name: '' },
            { name: '.' },
            { name: '-' },
            { name: 'Cliente WhatsApp' },
            { name: 'Cliente Verto' },
            { name: 'Cliente' },
            { name: { startsWith: 'WhatsApp' } },
            { name: { startsWith: 'Contato WhatsApp' } },
            { name: { contains: '@lid' } }
          ]
        },
        select: { id: true, name: true, phone: true, whatsappLid: true },
        take: 30
      });

      console.log('Total contatos genericos retornados (amostra de 30):', genericContacts.length);
      console.log(JSON.stringify(genericContacts, null, 2));

      await prisma.$disconnect();
    }
    check().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    let out = '';
    let errOut = '';
    stream.on('close', () => {
      console.log('OUT:\n' + out);
      if (errOut) console.log('ERR:\n' + errOut);
      conn.end();
    }).on('data', d => out += d).stderr.on('data', d => errOut += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
