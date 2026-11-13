const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  const candidateInstances = await prisma.whatsAppInstance.findMany({
    where: { status: 'connected' },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });

  candidateInstances.sort((a, b) => {
    const aIsAvall = a.phoneNumber?.includes('96283090') || a.name?.toLowerCase().includes('avall') ? 1 : 0;
    const bIsAvall = b.phoneNumber?.includes('96283090') || b.name?.toLowerCase().includes('avall') ? 1 : 0;
    if (aIsAvall !== bIsAvall) return bIsAvall - aIsAvall;

    const aIsDest = a.phoneNumber?.includes('91109159') ? 1 : 0;
    const bIsDest = b.phoneNumber?.includes('91109159') ? 1 : 0;
    return aIsDest - bIsDest;
  });

  console.log('Ordem de prioridade para envio 2FA:');
  candidateInstances.forEach((inst, idx) => {
    console.log((idx + 1) + '. ' + inst.name + ' (' + inst.phoneNumber + ')');
  });

  await prisma.$disconnect();
}

checkOrder().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_2fa_order.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_2fa_order.js', (err, stream) => {
        if (err) throw err;
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

