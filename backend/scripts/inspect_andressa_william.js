const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

async function main() {
  // 1. Inspeciona o contato Andressa e mensagens
  const andressas = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: "Andressa", mode: "insensitive" } },
        { phone: { contains: "9684" } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            take: 5,
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });
  console.log("=== ANDRESSA NO BANCO ===");
  for (const a of andressas) {
    console.log("ID:", a.id, "Nome:", a.name, "Phone:", a.phone, "whatsappLid:", a.whatsappLid);
    for (const c of a.conversations) {
      console.log("  Conv:", c.id);
      for (const m of c.messages) {
        console.log("    Msg:", m.direction, m.content ? m.content.substring(0, 40) : "[sem texto]");
      }
    }
  }

  // 2. Inspeciona Felipe Primo Andressa / William
  const felipes = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: "Primo", mode: "insensitive" } },
        { name: { contains: "William", mode: "insensitive" } },
        { phone: { contains: "8423" } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            take: 5,
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });
  console.log("=== FELIPE / WILLIAM NO BANCO ===");
  for (const f of felipes) {
    console.log("ID:", f.id, "Nome:", f.name, "Phone:", f.phone, "whatsappLid:", f.whatsappLid);
    for (const c of f.conversations) {
      console.log("  Conv:", c.id);
      for (const m of c.messages) {
        console.log("    Msg:", m.direction, m.content ? m.content.substring(0, 40) : "[sem texto]");
      }
    }
  }

  // 3. Busca na Evolution API os contatos com Amor, Andressa, William
  const instName = "versus_c38f8968ee_1bceb585fb";
  const fc = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  if (Array.isArray(fc.data)) {
    const amor = fc.data.filter(c => 
      (c.name && c.name.toLowerCase().includes("amor")) ||
      (c.pushName && c.pushName.toLowerCase().includes("amor")) ||
      (c.name && c.name.toLowerCase().includes("william")) ||
      (c.pushName && c.pushName.toLowerCase().includes("william")) ||
      (c.name && c.name.toLowerCase().includes("prado"))
    );
    console.log("=== CONTATOS NA AGENDA (Amor, William, Prado) ===");
    console.log(JSON.stringify(amor, null, 2));
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
