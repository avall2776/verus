const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const contacts = await prisma.contact.findMany({
    where: {
      tenantId,
      OR: [
        { id: '7c32daa8-05cd-4a31-a5b4-0f1cdc501d9f' },
        { id: 'a6616b54-32a3-4896-856a-ac9fdc46b59d' },
        { phone: { contains: '98782626' } },
        { name: { contains: 'Gerson' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            select: { id: true, content: true, direction: true, fromMe: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(contacts, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_gerson.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_gerson.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
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
