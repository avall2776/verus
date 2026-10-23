const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const msgs = await prisma.message.findMany({
    where: {
      content: { contains: "Malvestitti", mode: "insensitive" }
    },
    include: {
      conversation: {
        include: { contact: true }
      }
    }
  });
  console.log("Mensagens com Malvestitti:", msgs.map(m => ({
    content: m.content,
    contactName: m.conversation.contact.name,
    contactPhone: m.conversation.contact.phone
  })));

  // Buscar contatos em todos os tenants com Malvestitti
  const allMal = await prisma.contact.findMany({
    where: {
      name: { contains: "Malvestitti", mode: "insensitive" }
    }
  });
  console.log("Contatos em todos os tenants com Malvestitti:", allMal);

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
