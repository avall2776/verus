const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

  // Procura conversas do contato do Maurício Wesolowski
  const conv = await prisma.conversation.findFirst({
    where: { contactId: 'e3840b40-4aee-4a73-a035-99dd8d1f7171' },
    include: {
      messages: {
        take: 3,
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  console.log('Maurício conv:', conv);

  // Procura mensagens enviadas ou recebidas com esse LID
  const msgs = await prisma.message.findMany({
    where: {
      tenantId,
      OR: [
        { senderId: { contains: '1275047' } },
        { providerMessageId: { contains: '1275047' } }
      ]
    },
    take: 3
  });
  console.log('Mensagens do Maurício:', msgs);

  // Vamos ver todas as conversas do tenant fc89e34b-2bc5-462d-9bfd-45b06e1d0126 que tem mensagens recentes
  const recentConvs = await prisma.conversation.findMany({
    where: { tenantId },
    take: 10,
    orderBy: { updatedAt: 'desc' },
    include: { contact: true }
  });
  console.log('Conversas recentes do tenant:', recentConvs.map(c => ({
    id: c.id,
    contactName: c.contact?.name,
    contactPhone: c.contact?.phone,
    whatsappLid: c.contact?.whatsappLid
  })));

  await prisma.$disconnect();
}
main().catch(console.error);
`;

  const remoteCmd = `node << 'EOF'
${nodeScript}
EOF
`;

  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
