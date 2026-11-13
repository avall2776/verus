const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const conv1 = await prisma.conversation.findUnique({
    where: { id: '93da8f7c-b285-4154-b796-9408143ab9a5' },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });
  console.log('=== CONVERSA 1 (Josnherth / Ale) ===');
  console.log('Contato:', conv1?.contact?.name, conv1?.contact?.phone, 'LID:', conv1?.contact?.whatsappLid);
  for (const m of conv1?.messages || []) {
    console.log('  [' + m.direction + '] [' + m.createdAt.toISOString() + '] ' + m.content);
  }

  const conv2 = await prisma.conversation.findUnique({
    where: { id: 'f9e486d5-99fd-43cd-8292-fd225d53289b' },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: 'asc' } }
    }
  });
  console.log('=== CONVERSA 2 (Silvio Santana) ===');
  console.log('Contato:', conv2?.contact?.name, conv2?.contact?.phone, 'LID:', conv2?.contact?.whatsappLid);
  for (const m of conv2?.messages || []) {
    console.log('  [' + m.direction + '] [' + m.createdAt.toISOString() + '] ' + m.content);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_merged_threads.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_merged_threads.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
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

