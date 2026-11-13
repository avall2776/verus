const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c1 = await prisma.contact.findUnique({
    where: { id: 'd9c83e98-1eab-4fce-8e75-b1b3b2059258' },
    include: { conversations: { include: { messages: true } } }
  });
  console.log('=== CONTATO CRIADO PELO AUDIO (Willian Rangel) ===');
  console.log(JSON.stringify(c1, null, 2));

  const c2 = await prisma.contact.findFirst({
    where: { phone: { contains: '992258423' } },
    include: { conversations: { include: { messages: true } } }
  });
  console.log('\\n=== CONTATO ORIGINAL (Willian Rangel de Sousa) ===');
  console.log(JSON.stringify(c2, null, 2));

  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_both_willians.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_both_willians.js', (err, stream) => {
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

