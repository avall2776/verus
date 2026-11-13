const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const convs = await prisma.conversation.findMany({
    where: { contact: { name: { contains: 'Rodrigo', mode: 'insensitive' } } },
    include: { contact: true, department: true }
  });
  console.log('All Rodrigo Convs:', convs.map(conv => ({
    id: conv.id,
    contactName: conv.contact.name,
    phone: conv.contact.phone,
    status: conv.status,
    assignedTo: conv.assignedTo,
    departmentId: conv.departmentId,
    deptName: conv.department?.name
  })));
}
check().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/check_rodrigo.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node check_rodrigo.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/verus/backend/check_rodrigo.js', () => conn.end());
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
