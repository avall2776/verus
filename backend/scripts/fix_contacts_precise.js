const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Executando mesclagem com migração de mensagens da Sophia...');
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

const ACTIVE_TENANT = "c38f8968-ee21-437c-a1b5-f83d0307cb4b";

async function main() {
  console.log("=== FINALIZANDO MESCLAGEM DA SOPHIA ===");

  // Encontra sophiaPrincipal
  const sophiaPrincipal = await prisma.contact.findFirst({
    where: {
      tenantId: ACTIVE_TENANT,
      OR: [
        { name: { contains: "Sophia" } },
        { id: "dc3d5734-df29-418a-ac83-7175055742a3" }
      ]
    }
  });

  console.log("Sophia Principal:", sophiaPrincipal.id, sophiaPrincipal.name);

  // Encontra conversa principal de Sophia
  let mainConv = await prisma.conversation.findFirst({
    where: { contactId: sophiaPrincipal.id, tenantId: ACTIVE_TENANT }
  });

  if (!mainConv) {
    mainConv = await prisma.conversation.create({
      data: {
        tenantId: ACTIVE_TENANT,
        contactId: sophiaPrincipal.id,
        status: "bot_active"
      }
    });
  }
  console.log("Main Conversation:", mainConv.id);

  // Contato secundário antigo
  const oldContact = await prisma.contact.findUnique({
    where: { id: "0340318b-51d8-4be3-87de-c1845cd2a0fb" }
  });

  if (oldContact) {
    const oldConvs = await prisma.conversation.findMany({
      where: { contactId: oldContact.id }
    });

    for (const oc of oldConvs) {
      console.log("Migrando mensagens da conversa antiga:", oc.id, "para:", mainConv.id);
      await prisma.message.updateMany({
        where: { conversationId: oc.id },
        data: {
          conversationId: mainConv.id,
          contactId: sophiaPrincipal.id,
          tenantId: ACTIVE_TENANT
        }
      });
      await prisma.conversation.delete({ where: { id: oc.id } });
    }
    await prisma.contact.delete({ where: { id: oldContact.id } }).catch(() => {});
  }

  // Garante que o contato principal tenha os dados 100% corretos
  const sophiaAvatar = "https://pps.whatsapp.net/v/t61.24694-24/810090619_1857218895648204_5227482942155984001_n.jpg?ccb=11-4&oh=01_Q5Aa5gFvhk9chtkBPpGvlcynO0NuMC4E9zkDi2SgGmtOWv0D_A&oe=6AC39077&_nc_sid=5e03e0&_nc_cat=108";
  await prisma.contact.update({
    where: { id: sophiaPrincipal.id },
    data: {
      name: "Sophia Filha 😍",
      phone: "555491154444",
      whatsappLid: "1271595553012@lid",
      avatarUrl: sophiaAvatar,
      tenantId: ACTIVE_TENANT
    }
  });

  console.log("=== SUCESSO ABSOLUTO NA MESCLAGEM DA SOPHIA ===");
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
