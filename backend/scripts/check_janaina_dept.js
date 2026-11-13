const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findUnique({
    where: { id: '43e3ab2e-72c4-4518-8509-9685a8edd986' },
    include: {
      departments: {
        include: { department: true }
      }
    }
  });
  console.log('User Janaina:', user?.name, 'Departments:', user?.departments?.map(d => ({ id: d.departmentId, name: d.department.name })));

  // Checar a conversa de 7d54bea2-c164-4666-96fa-03a7e6fe0868
  const conv = await prisma.conversation.findUnique({
    where: { id: '5d2ef975-32d2-4027-bcb4-e5908bbe77e7' },
    include: {
      contact: true,
      assignee: true,
      department: true
    }
  });
  console.log('Conversa principal:', {
    id: conv?.id,
    status: conv?.status,
    assignedTo: conv?.assignedTo,
    assigneeName: conv?.assignee?.name,
    departmentId: conv?.departmentId,
    departmentName: conv?.department?.name,
    contactName: conv?.contact?.name,
    contactPhone: conv?.contact?.phone,
    contactLid: conv?.contact?.whatsappLid
  });

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_janaina_dept.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_janaina_dept.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
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

