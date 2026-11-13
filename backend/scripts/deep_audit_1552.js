const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { execSync } = require('child_process');

async function run() {
  console.log('=== 1. MENSAGENS NO BANCO ENTRE 18:50 E 18:55 UTC ===');
  const msgs = await prisma.message.findMany({
    where: {
      createdAt: { gte: new Date('2026-11-09T18:50:00Z') }
    },
    include: {
      conversation: { include: { contact: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  for (const m of msgs) {
    console.log(JSON.stringify({
      time: m.createdAt,
      dir: m.direction,
      content: m.content,
      providerId: m.providerMessageId,
      status: m.status,
      contactId: m.conversation?.contact?.id,
      contactName: m.conversation?.contact?.name,
      contactPhone: m.conversation?.contact?.phone,
      contactLid: m.conversation?.contact?.whatsappLid
    }));
  }

  console.log('\\n=== 2. LOGS DO EVOLUTION API ENTRE 15:51 E 15:54 ===');
  const evoLogs = execSync('docker logs evolution-api --since 5m 2>&1').toString();
  console.log(evoLogs);

  console.log('\\n=== 3. LOGS DO BACKEND PM2 ===');
  const pm2Logs = execSync('tail -n 60 /root/.pm2/logs/versus-engine-out.log').toString();
  console.log(pm2Logs);

  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/deep_audit_1552.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/deep_audit_1552.js', (err, stream) => {
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

