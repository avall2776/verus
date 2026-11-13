const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

  const wesolowski = await prisma.contact.findFirst({
    where: {
      tenantId,
      name: { contains: 'Wesolowski', mode: 'insensitive' }
    }
  });
  console.log('Wesolowski contact:', wesolowski);

  // Vamos ver contatos que tem whatsappLid ou telefone com 127504710955167
  const byLid = await prisma.contact.findMany({
    where: {
      tenantId,
      OR: [
        { whatsappLid: { not: null } },
        { phone: { contains: '12750' } }
      ]
    },
    take: 10
  });
  console.log('Contatos com LID ou phone contendo 12750:', byLid);

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
