const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const contact = await prisma.contact.findFirst({
    where: { phone: { contains: '84841099' } }
  });
  if (!contact) {
    console.log('Contato nao encontrado');
    return;
  }
  const msgs = await prisma.message.findMany({
    where: { conversation: { contactId: contact.id } },
    orderBy: { createdAt: 'desc' },
    take: 12
  });
  console.log('SILVIO SANTANA (' + contact.phone + '):');
  for (const m of msgs.reverse()) {
    console.log('[' + m.direction + ' ' + m.type + ' ' + m.createdAt.toISOString() + '] ' + (m.content || m.mediaUrl || ''));
  }
  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_silvio_conv.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_silvio_conv.js', (err, stream) => {
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

