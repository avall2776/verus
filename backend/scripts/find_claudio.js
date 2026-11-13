const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { phone: { contains: '91109159' } },
        { name: { contains: 'Claudio' } },
        { name: { contains: 'Felipe Costa' } }
      ]
    },
    include: {
      conversations: {
        include: {
          _count: { select: { messages: true } }
        }
      }
    }
  });

  console.log('CONTACTS FOUND:', contacts.length);
  for (const c of contacts) {
    console.log(JSON.stringify({
      id: c.id,
      name: c.name,
      phone: c.phone,
      tenantId: c.tenantId,
      conversations: c.conversations.map(conv => ({
        id: conv.id,
        messagesCount: conv._count.messages
      }))
    }, null, 2));
  }
  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/find_claudio.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/find_claudio.js', (err, stream) => {
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

