const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function check() {
      const constraints = await prisma.$queryRawUnsafe(\`
        SELECT conname, contype, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE conrelid = '"User"'::regclass;
      \`);
      console.log('Constraints on User table:', JSON.stringify(constraints, null, 2));

      const indexes = await prisma.$queryRawUnsafe(\`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'User';
      \`);
      console.log('Indexes on User table:', JSON.stringify(indexes, null, 2));

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
