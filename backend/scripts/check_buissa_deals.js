const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vertoId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

  // 1. José Augusto Buissa
  const buissa = await prisma.contact.findMany({
    where: {
      tenantId: vertoId,
      name: { contains: 'Buissa', mode: 'insensitive' }
    }
  });
  console.log('Buissa contacts:', buissa);

  // 2. Deals de Buissa, Maurício, Plinio, Lucas, Junior
  const contactIds = [
    'e3840b40-4aee-4a73-a035-99dd8d1f7171', // Maurício Wesolowski
    '4a839b81-113a-4e76-822c-366977f69065', // José Augusto Buissa
    '8bd2d8fa-e246-4c6d-a510-d8f60aba1798', // Plinio Parisotto
    '18cb7c19-0b0a-45a9-96ff-d2e4d35eabbc', // Lucas
    '13ffd2ff-cb78-4733-847e-be028b6b2569'  // Junior Verto
  ];

  const deals = await prisma.deal.findMany({
    where: {
      tenantId: vertoId,
      contactId: { in: contactIds }
    }
  });
  console.log('Deals encontrados para esses contatos:', deals);

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
