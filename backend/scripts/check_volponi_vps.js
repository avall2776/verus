const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function check() {
      const user = await prisma.user.findFirst({
        where: { email: { equals: 'volponi.marketing@gmail.com', mode: 'insensitive' } },
        include: { tenant: true }
      });
      console.log('User found:', JSON.stringify(user, null, 2));
      await prisma.$disconnect();
    }
    check().catch(console.error);
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
