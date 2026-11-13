const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // 1. Mensagens com remoteJid ou contactId
  const msgs = await prisma.message.findMany({
    where: {
      tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
      OR: [
        { contactId: 'cc0d7a32-daa1-4fb7-b66e-07caa65f4a5d' },
        { contactId: 'f1d85c8f-2580-4d86-9593-1ed81bfbd6c6' },
        { contactId: '7d54bea2-c164-4666-96fa-03a7e6fe0868' }
      ]
    },
    select: { id: true, contactId: true, conversationId: true, createdAt: true, content: true, fromMe: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Total msgs encontradas nos 3 contatos:', msgs.length);
  const byContact = {};
  for (const m of msgs) {
    byContact[m.contactId] = (byContact[m.contactId] || 0) + 1;
  }
  console.log('Msgs por contato:', byContact);

  // 2. Checar se existem Deals para algum desses contatos
  const deals = await prisma.deal.findMany({
    where: {
      tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
      contactId: { in: [
        'cc0d7a32-daa1-4fb7-b66e-07caa65f4a5d',
        'f1d85c8f-2580-4d86-9593-1ed81bfbd6c6',
        '7d54bea2-c164-4666-96fa-03a7e6fe0868'
      ]}
    }
  });
  console.log('Deals encontrados:', deals);

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_tiao_details.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_tiao_details.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

