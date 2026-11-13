const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const names = ['Rodrigo Trojan', 'Kasama', 'Eder Gurski', 'Edson Valcanaia', 'Eduardo Stephan'];
  for (const n of names) {
    const contact = await prisma.contact.findFirst({
      where: { name: { contains: n, mode: 'insensitive' } },
      include: {
        conversations: {
          include: {
            messages: { take: 3, orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });
    console.log(n, '-> found:', contact ? {
      name: contact.name,
      phone: contact.phone,
      convs: contact.conversations.map(c => ({
        id: c.id,
        status: c.status,
        assignedTo: c.assignedTo,
        msgCount: c.messages.length,
        lastMsg: c.messages[0]?.content
      }))
    } : 'NOT FOUND');
  }
}
check().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/check_names.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node check_names.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/verus/backend/check_names.js', () => conn.end());
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
