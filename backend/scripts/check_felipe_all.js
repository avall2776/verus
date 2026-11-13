const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const msgs = await prisma.message.findMany({
    where: {
      OR: [
        { conversation: { contact: { phone: { contains: '5491109159' } } } },
        { conversation: { contact: { phone: { contains: '54991109159' } } } }
      ]
    },
    include: { conversation: { include: { contact: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('MSGS TO FELIPE: ' + msgs.length);
  for (const m of msgs) {
    console.log(JSON.stringify({
      id: m.id,
      createdAt: m.createdAt,
      direction: m.direction,
      type: m.type,
      content: m.content,
      mediaUrl: m.mediaUrl,
      providerMessageId: m.providerMessageId,
      status: m.status
    }));
  }
  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_felipe_all.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_felipe_all.js', (err, stream) => {
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

