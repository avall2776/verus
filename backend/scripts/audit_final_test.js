const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const fileContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const userId = '5353b252-8843-45b9-bd77-89e1e341dccd';
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

  const userDepts = await prisma.userDepartment.findMany({
    where: { userId },
    select: { departmentId: true, department: { select: { name: true } } },
  });
  const allowedDeptIds = userDepts.map(ud => ud.departmentId);
  console.log('Plinio allowed depts:', userDepts.map(d => d.department.name));

  // Query Tab 'all' exactly as chat.service.ts does now
  const whereClause = {
    tenantId,
    assignedTo: userId,
    departmentId: { in: allowedDeptIds }
  };

  const convsAll = await prisma.conversation.findMany({
    where: whereClause,
    select: {
      id: true,
      department: { select: { name: true } },
      contact: { select: { name: true } }
    }
  });

  console.log('Total Plinio conversations in Tab All:', convsAll.length);
  const byDept = {};
  convsAll.forEach(c => {
    const dName = c.department?.name || 'SEM';
    byDept[dName] = (byDept[dName] || 0) + 1;
  });
  console.log('Distribution by department in Tab All:', byDept);

  await prisma.$disconnect();
}
run().catch(console.error);
`;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/test_audit_final.js');
    stream.write(fileContent);
    stream.end();
    stream.on('close', () => {
      conn.exec('NODE_PATH=/root/verus/backend/node_modules:/root/verus/node_modules node /tmp/test_audit_final.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', (d) => out += d);
        stream.stderr.on('data', (d) => out += d);
        stream.on('close', () => {
          console.log('Output:\n', out);
          conn.end();
        });
      });
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

