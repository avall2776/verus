const { Client } = require('ssh2');

const scriptToRun = `
const { PrismaClient } = require('@prisma/client');

async function testUrl(name, url) {
  console.log('--- Testing ' + name + ' ---');
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const t0 = Date.now();
    await prisma.$queryRaw\`SELECT 1\`;
    console.log(name + ' Query 1 (connect+query):', Date.now() - t0, 'ms');

    const t1 = Date.now();
    await prisma.$queryRaw\`SELECT 1\`;
    console.log(name + ' Query 2 (warm query):', Date.now() - t1, 'ms');

    const t2 = Date.now();
    await prisma.user.findFirst();
    console.log(name + ' Query 3 (findFirst):', Date.now() - t2, 'ms');
  } catch (err) {
    console.error(name + ' Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const pgbouncer = 'postgresql://postgres.aoxajwlocxetfxthkdxa:xRR%40QZJ5g3UV%3F74@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
  const session5432 = 'postgresql://postgres.aoxajwlocxetfxthkdxa:xRR%40QZJ5g3UV%3F74@aws-0-us-east-2.pooler.supabase.com:5432/postgres?connection_limit=15&pool_timeout=15';
  const direct5432 = 'postgresql://postgres:xRR%40QZJ5g3UV%3F74@db.aoxajwlocxetfxthkdxa.supabase.co:5432/postgres?connection_limit=15&pool_timeout=15';

  await testUrl('Port 6543 (current VPS)', pgbouncer);
  await testUrl('Port 5432 Pooler', session5432);
  await testUrl('Direct 5432 Supabase', direct5432);
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cat << 'EOF' > /root/verus/backend/test_compare.js\n${scriptToRun}\nEOF\ncd /root/verus/backend && node test_compare.js`, (err, stream) => {
    if (err) throw err;
    let out = '';
    let errOut = '';
    stream.on('data', (d) => out += d);
    stream.stderr.on('data', (d) => errOut += d);
    stream.on('close', (code) => {
      console.log('STDOUT:\n', out);
      if (errOut) console.log('STDERR:\n', errOut);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
