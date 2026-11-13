const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const msgs = await prisma.message.findMany({
    where: { direction: 'OUTBOUND', createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } },
    include: { conversation: { include: { contact: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log('FOUND ' + msgs.length + ' MESSAGES:');
  for (const m of msgs) {
    console.log(JSON.stringify({
      id: m.id,
      createdAt: m.createdAt,
      content: m.content,
      providerMessageId: m.providerMessageId,
      status: m.status,
      contactName: m.conversation?.contact?.name,
      contactPhone: m.conversation?.contact?.phone
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
    const ws = sftp.createWriteStream('/tmp/find_recent.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/find_recent.js', (err, stream) => {
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

