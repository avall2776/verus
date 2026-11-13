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
  console.log('Plinio active departments:', userDepts.map(d => d.department.name));
  const allowedDeptIds = userDepts.map(ud => ud.departmentId);

  // Aguardando tab
  const waitingWhere = {
    tenantId,
    departmentId: { in: allowedDeptIds },
    OR: [
      { status: { in: ['waiting', 'bot_active'] } },
      { assignedTo: null, status: { notIn: ['resolved', 'closed'] } }
    ]
  };

  const waitingConvs = await prisma.conversation.findMany({
    where: waitingWhere,
    select: {
      id: true,
      department: { select: { name: true } },
      contact: { select: { name: true, phone: true } }
    },
    take: 10
  });

  console.log('Top 10 Aguardando for Plinio:');
  waitingConvs.forEach((c, i) => {
    console.log(\`\${i+1}. \${c.contact?.name} (\${c.department?.name})\`);
  });

  // Check if any Comercial lead remains in Plinio's Aguardando
  const foreignInWaiting = await prisma.conversation.count({
    where: {
      ...waitingWhere,
      departmentId: 'c735ab57-dd57-4f86-b853-ff57b0c92847' // Comercial
    }
  });
  console.log('Comercial leads in Plinio Aguardando:', foreignInWaiting);

  await prisma.$disconnect();
}
run().catch(console.error);
`;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/test_plinio_clean.js');
    stream.write(fileContent);
    stream.end();
    stream.on('close', () => {
      conn.exec('NODE_PATH=/root/verus/backend/node_modules:/root/verus/node_modules node /tmp/test_plinio_clean.js', (err, stream) => {
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

