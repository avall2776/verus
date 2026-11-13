const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const countWithPos = await prisma.deal.count({
    where: {
      tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
      metadata: { path: ['position'], not: undefined }
    }
  });
  console.log('Deals with position:', countWithPos);
  const totalDeals = await prisma.deal.count({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' }
  });
  console.log('Total deals:', totalDeals);
}
check().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/check_progress.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node check_progress.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/verus/backend/check_progress.js', () => conn.end());
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

