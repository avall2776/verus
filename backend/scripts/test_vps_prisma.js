const { Client } = require('ssh2');

const scriptToRun = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Testing query raw...');
  const t0 = Date.now();
  await prisma.$queryRaw\`SELECT 1\`;
  console.log('Query 1 took:', Date.now() - t0, 'ms');

  const t1 = Date.now();
  await prisma.$queryRaw\`SELECT 1\`;
  console.log('Query 2 took:', Date.now() - t1, 'ms');

  const t2 = Date.now();
  const user = await prisma.user.findFirst();
  console.log('Find user took:', Date.now() - t2, 'ms', user ? user.email : 'none');

  const t3 = Date.now();
  const convs = await prisma.conversation.findMany({ take: 10 });
  console.log('Find conversations took:', Date.now() - t3, 'ms', 'count:', convs.length);

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`cat << 'EOF' > /root/verus/backend/test_perf.js\n${scriptToRun}\nEOF\ncd /root/verus/backend && node test_perf.js`, (err, stream) => {
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
