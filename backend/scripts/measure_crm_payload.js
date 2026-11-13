const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const tenant = await prisma.tenant.findFirst();
  const t0 = Date.now();
  const deals = await prisma.deal.findMany({
    where: { tenantId: tenant.id },
    include: {
      contact: {
        select: { id: true, name: true, phone: true, email: true, source: true, tags: true }
      },
      assignee: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
  const t1 = Date.now();
  const json = JSON.stringify(deals);
  console.log('Total deals:', deals.length);
  console.log('Query time:', (t1 - t0), 'ms');
  console.log('Payload size in bytes:', json.length, '(' + (json.length / 1024 / 1024).toFixed(2) + ' MB)');
  await prisma.$disconnect();
}
test().catch(console.error);
  `;

  conn.exec(`cat << 'EOF' > /tmp/test_deals.js\n${code}\nEOF\nnode /tmp/test_deals.js`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});
