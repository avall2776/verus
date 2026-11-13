const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const fileContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const userId = '5353b252-8843-45b9-bd77-89e1e341dccd'; // Plinio
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  
  // Tab 'all' query with our new security filter
  const whereClauseAll = {
    tenantId,
    assignedTo: userId
  };

  const convsAll = await prisma.conversation.findMany({
    where: whereClauseAll,
    select: {
      id: true,
      assignedTo: true,
      status: true,
      contact: { select: { name: true, phone: true } }
    },
    take: 50
  });

  console.log('Total Plinio conversations in Tab All:', convsAll.length);
  const foreignAssigned = convsAll.filter(c => c.assignedTo !== userId);
  console.log('Conversations assigned to other operators in Plinio view:', foreignAssigned.length);

  await prisma.$disconnect();
}
test().catch(console.error);
`;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/verify_security.js');
    stream.write(fileContent);
    stream.end();
    stream.on('close', () => {
      conn.exec('NODE_PATH=/root/verus/backend/node_modules:/root/verus/node_modules node /tmp/verify_security.js', (err, stream) => {
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

