const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const vertoId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";

  const mappings = [
    { lid: "272000379523191@lid", name: "Beto Fracaro", phone: "555499320000" },
    { lid: "196761159254044@lid", name: "Cleiton", phone: "555491967460" },
    { lid: "209706207412358@lid", name: "Felipe", phone: "555496389633" },
    { lid: "51346669568105@lid", name: "Sandro Schacht", phone: "553499997549" },
    { lid: "120701616926895@lid", name: "Silvio", phone: "5518981276652" },
    { lid: "270570172227757@lid", name: "Paulo Port", phone: "555599269378" },
    { lid: "190151171014750@lid", name: "André", phone: "595983653625" },
    { lid: "30966814928900@lid", name: "Marcelo Santana", phone: "556199623428" },
    { lid: "140651622572141@lid", name: "Luis Cesar Cruz", phone: "554299168982" },
    { lid: "243851147145394@lid", name: "Bruno", phone: "595986469070" },
    { lid: "235617627672784@lid", name: "Produtor Rural (Nova Aurora)", phone: null },
    { lid: "40080769069100@lid", name: "Produtor Nova Aurora PR", phone: null },
    { lid: "255907053178987@lid", name: "Cliente Verto", phone: null },
    { lid: "140290979561518@lid", name: "Cliente Plantadeira", phone: null },
    { lid: "31499474731238@lid", name: "Cliente Verto", phone: null },
    { lid: "103349999390945@lid", name: "Cliente Plantadeira", phone: null },
    { lid: "221375650332918@lid", name: "Cliente Verto", phone: null },
    { lid: "150156469088298@lid", name: "Cliente Verto", phone: null },
    { lid: "42288399036561@lid", name: "Gabriel Produtor", phone: null },
    { lid: "205746784497875@lid", name: "Cliente Verto", phone: null },
    { lid: "58175684366421@lid", name: "Interessado Semeadora Verão", phone: null },
    { lid: "58682742145130@lid", name: "Cliente Verto", phone: null },
    { lid: "186097275547786@lid", name: "Interessado Semeadora Vero", phone: null },
    { lid: "108052921458712@lid", name: "Cliente Verto", phone: null },
    { lid: "70665298284726@lid", name: "Cliente Verto", phone: null }
  ];

  for (const item of mappings) {
    const lidContact = await prisma.contact.findFirst({
      where: { tenantId: vertoId, phone: item.lid },
      include: { conversations: true }
    });

    if (!lidContact) continue;

    if (item.phone) {
      const realContact = await prisma.contact.findFirst({
        where: { tenantId: vertoId, phone: item.phone },
        include: { conversations: true }
      });

      if (realContact) {
        console.log("Mesclando LID [" + item.lid + "] para contato real [" + realContact.name + " - " + realContact.phone + "]");
        
        const realConv = realContact.conversations[0];
        for (const lidConv of lidContact.conversations) {
          if (realConv) {
            // Mover mensagens para a conversa real
            await prisma.message.updateMany({
              where: { conversationId: lidConv.id },
              data: { conversationId: realConv.id }
            });
            await prisma.conversation.delete({ where: { id: lidConv.id } });
          } else {
            // Atualizar conversa para o contato real
            await prisma.conversation.update({
              where: { id: lidConv.id },
              data: { contactId: realContact.id }
            });
          }
        }

        // Atualizar whatsappLid no contato real
        await prisma.contact.update({
          where: { id: realContact.id },
          data: { whatsappLid: item.lid }
        });

        // Deletar contato LID duplicado
        await prisma.contact.delete({ where: { id: lidContact.id } }).catch(() => {});
        continue;
      }
    }

    // Se não tem contato real correspondente, atualiza o nome do contato LID
    if (item.name) {
      console.log("Atualizando nome de contato LID [" + item.lid + "] -> " + item.name);
      await prisma.contact.update({
        where: { id: lidContact.id },
        data: { name: item.name }
      });
    }
  }

  console.log("✅ Reconciliação concluída com sucesso!");
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
