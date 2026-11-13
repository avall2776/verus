const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const masterConvId = '24110053-73f0-45ed-8c01-abf223e631d9';
  const conv = await prisma.conversation.findUnique({
    where: { id: masterConvId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, content: true, direction: true, fromMe: true, createdAt: true }
      }
    }
  });

  console.log('Conversa:', conv.id);
  console.log('Contato:', conv.contact.name, conv.contact.phone);
  console.log('Total msgs:', conv.messages.length);
  const last10 = conv.messages.slice(-10);
  last10.forEach(m => {
    const time = new Date(m.createdAt).toLocaleTimeString('pt-BR');
    console.log(\`[\${time}] [\${m.direction}] \${m.fromMe ? 'Atendente' : 'Cliente'}: \${m.content || '[mídia]'}\`);
  });
  await prisma.$disconnect();
}

run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/final_check_gerson.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/final_check_gerson.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
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

