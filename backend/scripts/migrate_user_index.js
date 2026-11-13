const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function migrate() {
      console.log('Migrating User email index to (tenantId, email)...');
      await prisma.$executeRawUnsafe('DROP INDEX IF EXISTS "User_email_key" CASCADE;');
      await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "User_tenantId_email_key" ON public."User" ("tenantId", "email");');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "User_email_idx" ON public."User" ("email");');
      console.log('Migration completed successfully in Postgres!');

      const indexes = await prisma.$queryRawUnsafe(\`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'User';
      \`);
      console.log('New indexes on User table:', JSON.stringify(indexes, null, 2));

      await prisma.$disconnect();
    }
    migrate().catch(console.error);
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
