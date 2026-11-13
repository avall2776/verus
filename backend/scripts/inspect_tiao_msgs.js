const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const instances = await prisma.whatsAppInstance.findMany();
  console.log('Whatsapp Instances no DB:', JSON.stringify(instances, null, 2));

  // Checar mensagens dos contatos do Tião
  const contactIds = [
    'cc0d7a32-daa1-4fb7-b66e-07caa65f4a5d',
    'f1d85c8f-2580-4d86-9593-1ed81bfbd6c6',
    '7d54bea2-c164-4666-96fa-03a7e6fe0868'
  ];

  for (const cId of contactIds) {
    const contact = await prisma.contact.findUnique({
      where: { id: cId },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                content: true,
                type: true,
                fromMe: true,
                status: true,
                createdAt: true,
                providerMessageId: true
              }
            }
          }
        }
      }
    });
    console.log('\\n========================================');
    console.log('Contato:', contact.id, contact.name, contact.phone, contact.whatsappLid);
    for (const conv of contact.conversations) {
      console.log('  Conversa:', conv.id, 'Status:', conv.status, 'assignedTo:', conv.assignedTo, 'Total msgs:', conv.messages.length);
      for (const m of conv.messages) {
        console.log('    [' + (m.fromMe ? 'OUT' : 'IN') + ' ' + m.createdAt.toISOString() + '] ' + m.type + ': ' + (m.content ? m.content.substring(0, 80) : ''));
      }
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/inspect_tiao_msgs.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/inspect_tiao_msgs.js', (err, stream) => {
        if (err) throw err;
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
