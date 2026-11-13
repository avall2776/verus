const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('=== BUSCANDO CONTATOS COM "Willian" ou "Rangel" ===');
  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Willian', mode: 'insensitive' } },
        { name: { contains: 'Rangel', mode: 'insensitive' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 3
          }
        }
      }
    }
  });

  console.log(JSON.stringify(contacts, null, 2));

  console.log('\\n=== ULTIMAS 10 MENSAGENS NO SISTEMA ===');
  const lastMsgs = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      conversation: {
        include: {
          contact: true
        }
      }
    }
  });

  for (const m of lastMsgs) {
    console.log({
      id: m.id,
      createdAt: m.createdAt,
      direction: m.direction,
      type: m.type,
      content: m.content ? m.content.substring(0, 50) : '',
      providerId: m.providerMessageId,
      conversationId: m.conversationId,
      contactName: m.conversation?.contact?.name,
      contactPhone: m.conversation?.contact?.phone,
      contactLid: m.conversation?.contact?.whatsappLid
    });
  }

  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/audit_willian_rangel.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/audit_willian_rangel.js', (err, stream) => {
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

