const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const axios = require('/root/verus/backend/node_modules/axios');
const prisma = new PrismaClient();

async function main() {
  const vertoId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const instName = 'versus_fc89e34b2b_babdc262eb';

  // 1. Procura no banco por Wesolowski
  const cList = await prisma.contact.findMany({
    where: {
      tenantId: vertoId,
      name: { contains: 'Wesolowski', mode: 'insensitive' }
    }
  });
  console.log('Contacts in DB matching Wesolowski:', cList);

  // 2. Procura no Baileys por contatos com foto 762997938
  const evoRes = await axios.post('http://localhost:8080/chat/findContacts/' + instName, {}, {
    headers: { apikey: 'verto123' }
  });
  const evoContacts = evoRes.data || [];
  const matchedPhoto = evoContacts.filter(c => c.profilePictureUrl && c.profilePictureUrl.includes('762997938'));
  console.log('Matched photo in Evolution:', matchedPhoto);

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
