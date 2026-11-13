const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const fileContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const start = Date.now();
  const userId = '5353b252-8843-45b9-bd77-89e1e341dccd';
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  
  const userDepts = await prisma.userDepartment.findMany({
    where: { userId },
    select: { departmentId: true },
  });
  const allowedDeptIds = userDepts.map(ud => ud.departmentId);
  console.log('User allowed departments:', allowedDeptIds);

  const whereClauseAll = {
    tenantId,
    departmentId: { in: allowedDeptIds.length > 0 ? allowedDeptIds : ['__NONE__'] }
  };

  const conversations = await prisma.conversation.findMany({
    where: whereClauseAll,
    select: {
      id: true,
      tenantId: true,
      status: true,
      assignedTo: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
      contact: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatarUrl: true,
          tags: true,
          source: true,
        }
      },
      department: {
        select: {
          id: true,
          name: true,
          color: true,
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          content: true,
          type: true,
          direction: true,
          createdAt: true,
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });

  console.log('Tab all count:', conversations.length, 'time ms:', Date.now() - start);
  const jsonStr = JSON.stringify(conversations);
  console.log('Tab all payload size KB:', (jsonStr.length / 1024).toFixed(2));

  // Mine tab
  const startMine = Date.now();
  const whereClauseMine = {
    tenantId,
    status: { in: ['open', 'human_takeover', 'in_progress'] },
    assignedTo: userId
  };

  const convsMine = await prisma.conversation.findMany({
    where: whereClauseMine,
    select: {
      id: true,
      tenantId: true,
      status: true,
      assignedTo: true,
      departmentId: true,
      createdAt: true,
      updatedAt: true,
      contact: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          avatarUrl: true,
          tags: true,
          source: true,
        }
      },
      department: {
        select: {
          id: true,
          name: true,
          color: true,
        }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true,
          content: true,
          type: true,
          direction: true,
          createdAt: true,
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });

  console.log('Tab mine count:', convsMine.length, 'time ms:', Date.now() - startMine);
  const jsonMineStr = JSON.stringify(convsMine);
  console.log('Tab mine payload size KB:', (jsonMineStr.length / 1024).toFixed(2));

  await prisma.$disconnect();
}
run().catch(console.error);
`;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/test_plinio.js');
    stream.write(fileContent);
    stream.end();
    stream.on('close', () => {
      conn.exec('NODE_PATH=/root/verus/backend/node_modules:/root/verus/node_modules node /tmp/test_plinio.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', (d) => out += d);
        stream.stderr.on('data', (d) => out += 'STDERR: ' + d);
        stream.on('close', () => {
          console.log('Output:\n', out);
          conn.end();
        });
      });
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });
