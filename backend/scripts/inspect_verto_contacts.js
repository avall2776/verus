const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

async function run() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  console.log("Tenants:", tenants);

  const verto = tenants.find(t => t.name.toLowerCase().includes("verto"));
  if (!verto) {
    console.log("Verto não encontrado!");
    return;
  }
  console.log("Verto ID:", verto.id);

  const instances = await prisma.whatsAppInstance.findMany({ where: { tenantId: verto.id } });
  console.log("Instâncias WhatsApp Verto:", instances.map(i => ({ id: i.id, name: i.name, status: i.status, phone: i.phoneNumber, settings: i.settings })));

  const totalContacts = await prisma.contact.count({ where: { tenantId: verto.id } });
  const lidContacts = await prisma.contact.count({
    where: {
      tenantId: verto.id,
      OR: [{ phone: { contains: "lid" } }, { whatsappLid: { not: null } }]
    }
  });
  const genericNamedContacts = await prisma.contact.count({
    where: {
      tenantId: verto.id,
      OR: [
        { name: { contains: "WhatsApp" } },
        { name: "Cliente WhatsApp" },
        { name: { contains: "lid" } }
      ]
    }
  });

  console.log("Verto Contatos: Total:", totalContacts, "LID:", lidContacts, "Generic Named:", genericNamedContacts);

  // Ver exemplos de contatos com LID ou genéricos
  const sampleBadContacts = await prisma.contact.findMany({
    where: {
      tenantId: verto.id,
      OR: [
        { phone: { contains: "lid" } },
        { name: { contains: "WhatsApp" } },
        { name: { contains: "lid" } }
      ]
    },
    take: 10,
    select: { id: true, name: true, phone: true, whatsappLid: true, avatarUrl: true }
  });
  console.log("Amostra de contatos problemáticos:", sampleBadContacts);

  // Verificar conversas ativas no Verto e quem são os contatos
  const convs = await prisma.conversation.findMany({
    where: { tenantId: verto.id },
    take: 15,
    orderBy: { updatedAt: "desc" },
    include: {
      contact: { select: { id: true, name: true, phone: true, whatsappLid: true } }
    }
  });
  console.log("Amostra de 15 conversas recentes:", convs.map(c => ({
    id: c.id,
    contactName: c.contact?.name,
    contactPhone: c.contact?.phone,
    contactLid: c.contact?.whatsappLid,
    lastMsgAt: c.lastMessageAt
  })));

  // Verificar na Evolution API os contatos da instância do Verto
  for (const inst of instances) {
    const instName = (inst.settings && inst.settings.instanceName) ? inst.settings.instanceName : inst.name.replace(" (WhatsApp Web)", "");
    try {
      const res = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
        headers: { apikey: "verto123" },
        timeout: 5000
      });
      console.log("Evolution API findContacts para [" + instName + "]: total=", Array.isArray(res.data) ? res.data.length : res.data);
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log("Amostra Evolution (primeiros 3):", res.data.slice(0, 3));
      }
    } catch (e) {
      console.log("Erro findContacts em " + instName + ":", e.message);
    }
  }

  // Verificar também quantidade de mensagens com mmg.whatsapp.net no Verto
  const countMmgVerto = await prisma.message.count({
    where: {
      mediaUrl: { contains: "mmg.whatsapp.net" },
      conversation: { tenantId: verto.id }
    }
  });
  console.log("Mensagens com mmg.whatsapp.net no Verto:", countMmgVerto);

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
