const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const msgs = await prisma.message.findMany({
    where: {
      conversation: { contactId: "dc3d5734-df29-418a-ac83-7175055742a3" }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  console.log("MENSAGENS DO CONTATO DC3D:");
  for (const m of msgs) {
    console.log(m.createdAt.toISOString(), m.direction, m.type, m.content);
  }
  await prisma.$disconnect();
}
main().catch(console.error);
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
