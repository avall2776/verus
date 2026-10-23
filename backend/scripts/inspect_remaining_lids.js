const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const vertoId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";
  const lids = await prisma.contact.findMany({
    where: {
      tenantId: vertoId,
      phone: { contains: "lid" }
    },
    include: {
      conversations: {
        include: {
          messages: {
            take: 3,
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  console.log("=== 26 CONTATOS COM LID RESTANTES ===");
  for (const c of lids) {
    console.log("-----------------------------------------");
    console.log("ID:", c.id, "Nome:", c.name, "Phone:", c.phone, "Convs:", c.conversations.length);
    for (const cv of c.conversations) {
      for (const m of cv.messages) {
        console.log("   Msg:", m.direction, m.senderName, m.content ? m.content.substring(0, 60) : "[sem texto]");
      }
    }
  }

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
