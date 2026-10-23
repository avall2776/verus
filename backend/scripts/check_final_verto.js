const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const vertoId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";

  const totalContacts = await prisma.contact.count({ where: { tenantId: vertoId } });
  const lidContacts = await prisma.contact.count({
    where: {
      tenantId: vertoId,
      phone: { contains: "lid" }
    }
  });
  const numericNamed = await prisma.contact.count({
    where: {
      tenantId: vertoId,
      name: { in: [".", "-"] }
    }
  });

  console.log("=== STATUS FINAL CONTATOS VERTO ===");
  console.log("Total contatos:", totalContacts);
  console.log("Contatos com @lid:", lidContacts);
  console.log("Contatos com nome ponto/traço:", numericNamed);

  // Amostra de conversas recentes do Verto
  const convs = await prisma.conversation.findMany({
    where: { tenantId: vertoId },
    take: 15,
    orderBy: { updatedAt: "desc" },
    include: {
      contact: { select: { id: true, name: true, phone: true } }
    }
  });
  console.log("15 conversas recentes:", convs.map(c => ({
    convId: c.id,
    name: c.contact?.name,
    phone: c.contact?.phone
  })));

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
