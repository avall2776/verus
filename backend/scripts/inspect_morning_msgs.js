const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const msgs = await prisma.message.findMany({
    where: {
      providerMessageId: { in: [
        'AC0F1300D904265323FBCC2B6760CE5F',
        'AC7F618BB095341929B4F97F3E02FFF4',
        'AC6BF6E6EE786756E7A42D4B27BA2E69',
        'AC5537FC09A7D9BDF0B539B5DA62AD55'
      ]}
    },
    include: {
      contact: true
    }
  });
  console.log(JSON.stringify(msgs.map(m => ({ id: m.id, content: m.content, contactId: m.contactId, contactName: m.contact.name, contactPhone: m.contact.phone, createdAt: m.createdAt })), null, 2));
  await prisma.$disconnect();
}

run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_morning_msgs.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_morning_msgs.js', (err, stream) => {
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

