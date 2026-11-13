const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const pending = await prisma.message.count({
    where: {
      createdAt: { gte: startOfDay },
      status: 'pending'
    }
  });

  const remainingLidContacts = await prisma.contact.count({
    where: {
      createdAt: { gte: startOfDay },
      phone: { contains: 'lid' }
    }
  });

  console.log('Mensagens pending restantes hoje:', pending);
  console.log('Contatos LID isolados restantes hoje:', remainingLidContacts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/final_check.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/final_check.js', (err, stream) => {
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

