const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const conv = await prisma.conversation.findUnique({
    where: { id: 'da27b095-6de2-4c78-ab7c-5c27424fc9b6' },
    include: { contact: true }
  });
  console.log('CONV FELIPE:', JSON.stringify(conv, null, 2));

  const claudioConv = await prisma.conversation.findFirst({
    where: { contact: { name: { contains: 'Claudio' } } },
    include: { contact: true }
  });
  console.log('CLAUDIO CONV:', JSON.stringify(claudioConv, null, 2));

  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_convs.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_convs.js', (err, stream) => {
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

