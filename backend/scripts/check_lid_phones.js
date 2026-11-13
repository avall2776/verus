const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

  // 1. Maurício Wesolowski
  const mauricio = await prisma.contact.findFirst({
    where: {
      tenantId,
      name: { contains: 'Maurício', mode: 'insensitive' }
    }
  });
  console.log('Maurício contact:', mauricio);

  // 2. Procura nas conversas do Maurício para achar o remoteJid real
  if (mauricio) {
    const conv = await prisma.conversation.findFirst({
      where: { contactId: mauricio.id }
    });
    console.log('Maurício conversation:', conv);
  }

  // 3. Procura no banco de conversas por esses LIDs
  const lids = [
    '127504710955167',
    '122522548838476',
    '38075052875866',
    '62302812397733',
    '153819992354947',
    '96843040075951'
  ];

  for (const lid of lids) {
    const c = await prisma.contact.findFirst({
      where: {
        tenantId,
        OR: [
          { phone: { contains: lid } },
          { name: { contains: lid } }
        ]
      }
    });

    const conv = await prisma.conversation.findFirst({
      where: {
        tenantId,
        OR: [
          { remoteJid: { contains: lid } },
          { id: lid }
        ]
      },
      include: { contact: true }
    });

    console.log('LID: ' + lid + ' -> Contact: ' + (c ? c.name + ' (' + c.phone + ')' : 'none') + ' | Conv contact: ' + (conv?.contact ? conv.contact.name + ' (' + conv.contact.phone + ')' : 'none'));
  }

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
