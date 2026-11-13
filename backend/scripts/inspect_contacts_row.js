const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c1 = await prisma.contact.findUnique({
    where: { id: '687b1e52-3aec-46c3-87fe-17aeed9d37f3' }
  });
  console.log('=== CONTACT 1 (Ale) ===', JSON.stringify(c1, null, 2));

  const c2 = await prisma.contact.findUnique({
    where: { id: '810445ec-0c86-43f3-960a-994c3b7fed4d' }
  });
  console.log('=== CONTACT 2 (Silvio) ===', JSON.stringify(c2, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_contacts_row.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_contacts_row.js', (err, stream) => {
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

