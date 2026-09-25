const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenantId = "c38f8968-ee21-437c-a1b5-f83d0307cb4b";
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    include: {
      conversations: {
        include: {
          messages: {
            take: 2,
            orderBy: { createdAt: "desc" }
          }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });
  console.log("=== TODOS CONTATOS DO TENANT ATUAL (Total: " + contacts.length + ") ===");
  for (const c of contacts) {
    const lastMsg = c.conversations[0]?.messages[0];
    console.log("-----------------------------------------");
    console.log("ID:", c.id);
    console.log("Nome:", c.name);
    console.log("Phone:", c.phone);
    console.log("whatsappLid:", c.whatsappLid);
    console.log("Avatar:", c.avatarUrl ? "Sim" : "Não");
    if (lastMsg) {
      console.log("Ultima Msg (" + lastMsg.createdAt.toISOString() + "):", lastMsg.direction, lastMsg.content ? lastMsg.content.substring(0, 50) : "[sem texto]");
    }
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
