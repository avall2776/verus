const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.contact.findFirst({
    where: { name: { contains: "Malvestitti" } },
    include: {
      conversations: {
        include: {
          messages: {
            take: 10,
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });
  console.log("Contato:", c.id, c.name, c.phone, c.whatsappLid);
  for (const cv of c.conversations) {
    console.log("Conv:", cv.id);
    for (const m of cv.messages) {
      console.log("  Msg:", m.direction, m.senderName, m.content ? m.content.substring(0, 70) : "[sem texto]");
    }
  }

  await prisma.$disconnect();
}
run().catch(console.error);
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
