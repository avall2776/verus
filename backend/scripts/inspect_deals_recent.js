const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const deals = await prisma.deal.findMany({
    where: {
      createdAt: { gte: new Date('2026-11-09T00:00:00Z') }
    },
    include: { contact: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log('DEALS CRIADOS DESDE 09/11 (' + deals.length + ' deals):');
  for (const d of deals) {
    console.log(\`[\${d.createdAt.toISOString()}] Tenant: \${d.tenantId} | Lead: \${d.contact?.name} | Status: \${d.status} | Title: \${d.title} | Notes: \${d.notes}\`);
    console.log('Metadata:', JSON.stringify(d.metadata));
    console.log('---');
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/inspect_deals_recent.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/inspect_deals_recent.js', (err2, stream) => {
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

