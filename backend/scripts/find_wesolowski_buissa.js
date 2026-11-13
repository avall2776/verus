const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c1 = await prisma.contact.findMany({
    where: { name: { contains: 'Wesolowski', mode: 'insensitive' } }
  });
  console.log('Wesolowski:', c1);
  const c2 = await prisma.contact.findMany({
    where: { name: { contains: 'Buissa', mode: 'insensitive' } }
  });
  console.log('Buissa:', c2);
  await prisma.$disconnect();
}
run();
`;
  conn.exec(`node << 'EOF'\n${nodeScript}\nEOF\n`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
