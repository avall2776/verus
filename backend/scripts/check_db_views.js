const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

    async function check() {
      const views = await prisma.$queryRawUnsafe('SELECT id, phone, "contactName", "viewedAt" FROM "whatsapp_status_views" WHERE "tenantId" = $1 ORDER BY "viewedAt" DESC', tenantId);
      console.log('Total views in DB:', views.length);
      console.log('Sample DB views:', views.slice(0, 10));
      await prisma.$disconnect();
    }
    check();
  `;
  const stream = conn.exec('cd /root/verus/backend && node', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Result:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
    stream.write(script);
    stream.end();
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
