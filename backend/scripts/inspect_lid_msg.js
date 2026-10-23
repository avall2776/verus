const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

async function run() {
  const msgs = await prisma.message.findMany({
    where: { conversationId: "c9b771e2-568d-466f-8c14-890201e31c67" },
    take: 5,
    orderBy: { createdAt: "desc" }
  });
  console.log("Msgs in conv c9b771e2:");
  for (const m of msgs) {
    console.log({
      id: m.id,
      direction: m.direction,
      content: m.content,
      senderName: m.senderName,
      whatsappMessageId: m.whatsappMessageId,
      metadata: m.metadata
    });
  }

  // Buscar na Evolution API as mensagens desse chat ou o chat no banco do Evolution
  // Na Evolution API, podemos chamar /chat/findMessages/versus_fc89e34b2b_babdc262eb
  const instName = "versus_fc89e34b2b_babdc262eb";
  try {
    const fRes = await axios.post("http://localhost:8080/chat/findMessages/" + instName, {
      where: {
        key: {
          remoteJid: "103349999390945@lid"
        }
      }
    }, {
      headers: { apikey: "verto123" }
    });
    console.log("findMessages no Evolution para 103349999390945@lid:", JSON.stringify(fRes.data, null, 2));
  } catch (e) {
    console.log("Erro findMessages:", e.response?.data || e.message);
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
