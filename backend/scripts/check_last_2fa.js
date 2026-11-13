const { Client } = require('ssh2');

const scriptCode = `
const { execSync } = require('child_process');
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('=== 1. ÚLTIMOS LOGS DE 2FA NO PM2 ===');
  try {
    const logs = execSync('grep -a "2FA" /root/.pm2/logs/*.log | tail -n 25', { encoding: 'utf8' });
    console.log(logs);
  } catch (e) {
    console.log('Erro ao ler logs:', e.message);
  }

  console.log('=== 2. ÚLTIMOS REGISTROS NA TABELA TwoFactorVerification ===');
  const verifs = await prisma.twoFactorVerification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(verifs, null, 2));

  await prisma.$disconnect();
}

check().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_last_2fa.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_last_2fa.js', (err, stream) => {
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

