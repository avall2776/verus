const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const msgs = await prisma.message.findMany({
    where: {
      direction: 'OUTBOUND',
      createdAt: {
        gte: new Date('2026-11-09T16:00:00Z'), // 13:00 horario de brasilia
        lte: new Date('2026-11-09T18:25:00Z')  // 15:25 horario de brasilia
      }
    },
    include: {
      conversation: {
        include: {
          contact: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  const byContact = {};
  for (const m of msgs) {
    const cId = m.conversation?.contact?.id || 'unknown';
    if (!byContact[cId]) {
      byContact[cId] = {
        name: m.conversation?.contact?.name,
        phone: m.conversation?.contact?.phone,
        count: 0,
        types: []
      };
    }
    byContact[cId].count++;
    if (!byContact[cId].types.includes(m.type)) byContact[cId].types.push(m.type);
  }

  console.log('CLIENTES QUE RECEBERAM MENSAGENS NO PERIODO (' + Object.keys(byContact).length + ' clientes):');
  for (const c of Object.values(byContact)) {
    console.log('- ' + c.name + ' (' + c.phone + ') | ' + c.count + ' msgs [' + c.types.join(', ') + ']');
  }
  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_affected.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_affected.js', (err, stream) => {
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
