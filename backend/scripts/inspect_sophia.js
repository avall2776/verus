const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

async function main() {
  const instName = "versus_c38f8968ee_1bceb585fb";
  const fc = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  
  if (Array.isArray(fc.data)) {
    const sophia = fc.data.filter(c => 
      (c.name && c.name.toLowerCase().includes("sophia")) ||
      (c.pushName && c.pushName.toLowerCase().includes("sophia")) ||
      (c.name && c.name.toLowerCase().includes("sofia")) ||
      (c.pushName && c.pushName.toLowerCase().includes("sofia"))
    );
    console.log("=== SOPHIA NA EVOLUTION ===");
    console.log(JSON.stringify(sophia, null, 2));
  }

  const contactsInDb = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: "Sophia", mode: "insensitive" } },
        { name: { contains: "Sofia", mode: "insensitive" } },
        { phone: { contains: "991488915" } }
      ]
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
  console.log("=== SOPHIA NO BANCO ===");
  console.log(JSON.stringify(contactsInDb, null, 2));

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
