const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const contact = await prisma.contact.findUnique({
    where: { id: '7d54bea2-c164-4666-96fa-03a7e6fe0868' },
    include: {
      conversations: {
        include: {
          department: true,
          _count: { select: { messages: true } }
        }
      },
      deals: true
    }
  });

  const janaina = await prisma.user.findUnique({
    where: { id: '43e3ab2e-72c4-4518-8509-9685a8edd986' },
    select: { id: true, name: true, email: true }
  });

  console.log('=== STATUS FINAL DO TIÃO ===');
  console.log('Contato:', {
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    whatsappLid: contact.whatsappLid
  });
  console.log('Conversa:', {
    id: contact.conversations[0]?.id,
    status: contact.conversations[0]?.status,
    assignedTo: contact.conversations[0]?.assignedTo,
    atendenteNome: janaina?.name,
    department: contact.conversations[0]?.department?.name,
    totalMensagens: contact.conversations[0]?._count?.messages
  });
  console.log('Deal no CRM:', {
    id: contact.deals[0]?.id,
    title: contact.deals[0]?.title,
    assignedTo: contact.deals[0]?.assignedTo
  });

  // Teste de busca por 556781363966
  const cleanSearch = '556781363966';
  const cleanDigits = cleanSearch.replace(/\\D/g, '');
  const last8 = cleanDigits.slice(-8);
  const with9 = cleanDigits.slice(0, 4) + '9' + cleanDigits.slice(4);

  const searchResults = await prisma.conversation.findMany({
    where: {
      tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
      OR: [
        { contact: { phone: { contains: cleanDigits } } },
        { contact: { phone: { contains: last8 } } },
        { contact: { phone: { contains: with9 } } },
        { contact: { name: { contains: 'Tião', mode: 'insensitive' } } }
      ]
    },
    select: { id: true, contact: { select: { name: true, phone: true } } }
  });
  console.log('Busca por 556781363966 retornou:', searchResults);

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/verify_tiao.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/verify_tiao.js', (err, stream) => {
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

