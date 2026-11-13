const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const janaina = await prisma.user.findFirst({
    where: { name: { contains: 'Janaina' } },
    include: { departments: { include: { department: true } } }
  });
  console.log('Janaina departments:', janaina?.departments.map(d => ({
    deptId: d.departmentId,
    name: d.department.name
  })));

  const allDepts = await prisma.department.findMany({
    where: { tenantId: janaina.tenantId },
    select: { id: true, name: true }
  });
  console.log('All Tenant Departments:', allDepts);
}
check().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/check_janaina_depts.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node check_janaina_depts.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/verus/backend/check_janaina_depts.js', () => conn.end());
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

