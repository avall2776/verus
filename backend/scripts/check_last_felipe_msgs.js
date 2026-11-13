const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const msgs = await prisma.message.findMany({
    where: {
      conversationId: 'da27b095-6de2-4c78-ab7c-5c27424fc9b6',
      direction: 'OUTBOUND',
      createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log('MSGS SENT TO FELIPE IN LAST 30 MIN:', msgs.length);
  for (const m of msgs) {
    console.log(JSON.stringify({
      id: m.id,
      createdAt: m.createdAt,
      content: m.content,
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
    const ws = sftp.createWriteStream('/tmp/check_last_felipe.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_last_felipe.js', (err, stream) => {
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

