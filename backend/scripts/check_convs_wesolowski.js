const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const convs = await prisma.conversation.findMany({
    where: {
      contactId: { in: ['e3840b40-4aee-4a73-a035-99dd8d1f7171', '4a839b81-113a-4e76-822c-366977f69065'] }
    },
    include: {
      messages: { take: 5, orderBy: { createdAt: 'desc' } }
    }
  });
  console.log('Conversations:', JSON.stringify(convs, null, 2));
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
