const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const msg1 = await prisma.message.findUnique({
    where: { id: '86574e8b-8932-488a-afa6-c3ec49e567a6' }
  });
  console.log('=== MSG 1 (Oi bom dia) ===', JSON.stringify(msg1, null, 2));

  const msg2 = await prisma.message.findFirst({
    where: { content: { contains: 'Bom dia', mode: 'insensitive' }, contactId: '810445ec-0c86-43f3-960a-994c3b7fed4d' }
  });
  console.log('=== MSG 2 (Bom dia Blz) ===', JSON.stringify(msg2, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_raw_msgs.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_raw_msgs.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
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

