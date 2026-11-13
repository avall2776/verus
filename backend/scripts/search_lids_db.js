const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vertoId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const queryLids = [
    '62302812397733',
    '122522548838476',
    '153819992354947',
    '38075052875866',
    '96843040075951',
    '127504710955167'
  ];

  for (const q of queryLids) {
    const list = await prisma.contact.findMany({
      where: {
        tenantId: vertoId,
        OR: [
          { whatsappLid: { contains: q } },
          { phone: { contains: q } }
        ]
      }
    });
    console.log('Query: ' + q + ' -> Found: ' + list.length);
    for (const c of list) {
      console.log('   ID: ' + c.id + ' | Name: ' + c.name + ' | Phone: ' + c.phone + ' | Lid: ' + c.whatsappLid);
    }
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
