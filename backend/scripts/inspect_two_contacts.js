const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c1 = await prisma.contact.findUnique({
    where: { id: '7c32daa8-05cd-4a31-a5b4-0f1cdc501d9f' }
  });
  const c2 = await prisma.contact.findUnique({
    where: { id: 'a6616b54-32a3-4896-856a-ac9fdc46b59d' }
  });
  console.log('--- CONTACT 1 (7c32daa8) ---');
  console.log(JSON.stringify(c1, null, 2));
  console.log('--- CONTACT 2 (a6616b54) ---');
  console.log(JSON.stringify(c2, null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_two_contacts.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_two_contacts.js', (err, stream) => {
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

