const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('Vallor Users:', users);

  // Fetch all funnels from Lero
  const resFunnels = await fetch(LERO_API + '/functions/v1/api-funnels-handler/v1/funnels', {
    headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
  });
  const funnelsJson = await resFunnels.json();
  console.log('Lero Funnels & Stages:', JSON.stringify(funnelsJson, null, 2));
}
check().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/check_lero_sync_meta.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node check_lero_sync_meta.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/verus/backend/check_lero_sync_meta.js', () => conn.end());
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

