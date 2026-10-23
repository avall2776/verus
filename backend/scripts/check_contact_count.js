const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();
async function run() {
  const count = await prisma.contact.count({ where: { tenantId: "fc89e34b-2bc5-462d-9bfd-45b06e1d0126" } });
  const lidCount = await prisma.contact.count({ where: { tenantId: "fc89e34b-2bc5-462d-9bfd-45b06e1d0126", phone: { contains: "lid" } } });
  console.log("Total contatos Verto agora:", count, "LIDs restantes:", lidCount);
  await prisma.$disconnect();
}
run();
'
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
