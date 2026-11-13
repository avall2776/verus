const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.deal.updateMany({
    where: { contactId: '99792224-6a9e-4a4e-915e-74c163150241' },
    data: { contactId: '9a41fd7d-b7f2-4c11-80f6-a03f0b823041' }
  });
  await prisma.contact.delete({
    where: { id: '99792224-6a9e-4a4e-915e-74c163150241' }
  }).catch(console.error);
  console.log('Deals migrados e contato LID de Salvador removido!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/fix_deal_salvador.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/fix_deal_salvador.js', (err, stream) => {
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

