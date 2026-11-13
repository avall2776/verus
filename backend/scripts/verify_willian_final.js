const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const conv = await prisma.conversation.findUnique({
    where: { id: '67252434-e2cb-4aac-93b1-f7da8953c29c' },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });

  console.log('=== CONVERSA UNIFICADA DO WILLIAN ===');
  console.log('Contato:', conv?.contact?.name, '| Telefone:', conv?.contact?.phone, '| LID:', conv?.contact?.whatsappLid);
  console.log('Mensagens (' + conv?.messages?.length + '):');
  for (const m of conv?.messages || []) {
    console.log(' - [' + m.createdAt.toISOString() + '] [' + m.direction + '] [' + m.type + '] ' + (m.content || ''));
  }

  const dupCheck = await prisma.contact.findMany({
    where: { name: { contains: 'Willian Rangel', mode: 'insensitive' } }
  });
  console.log('\\nTotal de contatos encontrados com Willian Rangel:', dupCheck.length);

  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/verify_willian_final.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/verify_willian_final.js', (err, stream) => {
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

