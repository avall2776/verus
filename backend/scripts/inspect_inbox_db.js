const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const names = ['Rodrigo', 'Kasama', 'Gurski', 'Valcanaia', 'Stephan', 'Caio', 'Rosicleia'];
  for (const n of names) {
    const contacts = await prisma.contact.findMany({
      where: { name: { contains: n, mode: 'insensitive' } },
      include: {
        conversations: {
          include: {
            department: true,
            messages: { take: 1, orderBy: { createdAt: 'desc' } }
          }
        }
      }
    });
    console.log('Query:', n, '-> matches:', contacts.length);
    contacts.forEach(c => {
      console.log(' - Contact:', c.name, 'Phone:', c.phone);
      c.conversations.forEach(conv => {
        console.log('   Conv ID:', conv.id, 'status:', conv.status, 'assignedTo:', conv.assignedTo, 'dept:', conv.department?.name, 'lastMsgAt:', conv.updatedAt);
      });
    });
  }
}
check().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/check_inbox_items.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node check_inbox_items.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/verus/backend/check_inbox_items.js', () => conn.end());
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

