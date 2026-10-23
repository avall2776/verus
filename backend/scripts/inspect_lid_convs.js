const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

async function run() {
  const lidConvs = [
    "3e35732e-b8e7-4198-934c-14f329c6183b",
    "334380bd-2ff5-4eac-a809-3836ad3288b4",
    "c9b771e2-568d-466f-8c14-890201e31c67",
    "732c20a1-38d5-4755-9053-8c62990b01e2",
    "a50452ab-ab5a-4d21-a2dd-ef22ff02d9fd"
  ];

  for (const convId of lidConvs) {
    const conv = await prisma.conversation.findUnique({
      where: { id: convId },
      include: {
        contact: true,
        messages: {
          take: 3,
          orderBy: { createdAt: "desc" }
        }
      }
    });
    console.log("=== CONVERSATION:", convId, "===");
    console.log("Contact:", conv.contact.name, "phone:", conv.contact.phone, "lid:", conv.contact.whatsappLid);
    for (const m of conv.messages) {
      console.log("  Msg:", m.direction, "senderName:", m.senderName, "content:", m.content ? m.content.substring(0, 50) : "");
    }
  }

  // Verificar se o Evolution API tem chats correspondentes aos LIDs
  const instName = "versus_fc89e34b2b_babdc262eb";
  let chats = [];
  try {
    const chatsRes = await axios.get("http://localhost:8080/chat/findChats/" + instName, {
      headers: { apikey: "verto123" }
    });
    chats = chatsRes.data;
  } catch (e) {
    try {
      const chatsRes = await axios.post("http://localhost:8080/chat/findChats/" + instName, {}, {
        headers: { apikey: "verto123" }
      });
      chats = chatsRes.data;
    } catch (e2) {
      console.log("findChats não suportado:", e2.response?.status || e2.message);
    }
  }

  // Verificar se esses LIDs estão em findContacts do Evolution
  const contactsRes = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  if (Array.isArray(contactsRes.data)) {
    console.log("Total findContacts:", contactsRes.data.length);
    const foundLidInContacts = contactsRes.data.filter(c => 
      (c.id && (c.id.includes("209706207412358") || c.id.includes("272000379523191") || c.id.includes("103349999390945") || c.id.includes("42288399036561") || c.id.includes("31499474731238")))
    );
    console.log("findContacts para esses LIDs:", JSON.stringify(foundLidInContacts, null, 2));

    // Agora buscar se o pushName ou picture desses LIDs bate com algum contato s.whatsapp.net
    console.log("LIDs no findContacts geral:");
    const allLids = contactsRes.data.filter(c => c.id && c.id.includes("@lid"));
    console.log("Total de contatos com @lid na Evolution:", allLids.length, allLids);
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
