const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Executando reconciliação retroativa usando instâncias da Evolution...');
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

const extractPhotoId = (url) => {
  if (!url) return null;
  try {
    const cleanUrl = url.split("?")[0];
    const match = cleanUrl.match(/([0-9]+_[0-9]+_[0-9]+_n\\.jpg)/);
    if (match) return match[1];
    return cleanUrl.split("/").pop();
  } catch {
    return null;
  }
};

const normalizeName = (s) => {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\\s+/g, " ")
    .trim();
};

async function main() {
  // 1. Busca instâncias diretamente na Evolution API
  const evoRes = await axios.get("http://localhost:8080/instance/fetchInstances", {
    headers: { apikey: "verto123" }
  });
  const allInstances = Array.isArray(evoRes.data) ? evoRes.data : [];
  console.log("Total de instâncias Evolution:", allInstances.length);

  // Mapas globais de busca
  const picToContactMap = new Map();
  const nameToContactMap = new Map();

  for (const item of allInstances) {
    const instObj = item.instance || item;
    const realInstName = instObj.instanceName || instObj.name;
    const status = instObj.status || instObj.connectionStatus;
    if (status !== "open" && status !== "connected") continue;

    console.log("Buscando contatos na instância ativa:", realInstName);
    try {
      const fc = await axios.post("http://localhost:8080/chat/findContacts/" + realInstName, {}, {
        headers: { apikey: "verto123" }
      });
      if (Array.isArray(fc.data)) {
        console.log("-> Contatos retornados:", fc.data.length);
        for (const ec of fc.data) {
          if (!ec.id || ec.id.includes("@lid")) continue;
          const realPhone = ec.id.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/\\D/g, "");
          if (realPhone.length < 10 || realPhone.length > 13) continue;

          const photoId = extractPhotoId(ec.profilePictureUrl);
          if (photoId) {
            picToContactMap.set(photoId, { realPhone, name: ec.pushName || ec.name, avatar: ec.profilePictureUrl });
          }

          const norm = normalizeName(ec.pushName || ec.name);
          if (norm && norm.length >= 3) {
            nameToContactMap.set(norm, { realPhone, name: ec.pushName || ec.name, avatar: ec.profilePictureUrl });
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao buscar contatos na instância", realInstName, e.message);
    }
  }

  console.log("Total de contatos indexados por foto:", picToContactMap.size);
  console.log("Total de contatos indexados por nome:", nameToContactMap.size);

  // 2. Busca contatos no banco
  const allContacts = await prisma.contact.findMany();
  console.log("Total de contatos no banco:", allContacts.length);

  let updated = 0;
  for (const contact of allContacts) {
    const phone = contact.phone || "";
    const cleanDigits = phone.replace(/\\D/g, "");
    const isLid = phone.includes("@lid") || (cleanDigits.length > 13 && !cleanDigits.startsWith("55"));

    if (isLid) {
      console.log("Processando contato LID:", contact.id, contact.name, phone);
      let match = null;

      // 1. Por foto
      const inPhotoId = extractPhotoId(contact.avatarUrl);
      if (inPhotoId && picToContactMap.has(inPhotoId)) {
        match = picToContactMap.get(inPhotoId);
        console.log(" -> MATCH POR FOTO! Telefone:", match.realPhone, "Nome:", match.name);
      }

      // 2. Por nome
      if (!match && contact.name && !contact.name.includes("@lid") && contact.name !== "Cliente WhatsApp") {
        const inNormName = normalizeName(contact.name);
        match = nameToContactMap.get(inNormName);
        if (!match) {
          const inFirstName = inNormName.split(" ")[0];
          for (const [key, val] of nameToContactMap.entries()) {
            if (key === inNormName || key === inFirstName || (key.startsWith(inFirstName) && inFirstName.length >= 4)) {
              match = val;
              break;
            }
          }
        }
        if (match) {
          console.log(" -> MATCH POR NOME! Telefone:", match.realPhone, "Nome:", match.name);
        }
      }

      if (match) {
        // Verifica se ja existe outro contato com esse phone real
        const existingReal = await prisma.contact.findFirst({
          where: {
            tenantId: contact.tenantId,
            phone: match.realPhone,
            NOT: { id: contact.id }
          }
        });

        if (existingReal) {
          console.log(" -> Mesclando com contato existente:", existingReal.id);
          await prisma.conversation.updateMany({
            where: { contactId: contact.id },
            data: { contactId: existingReal.id }
          });
          await prisma.contact.delete({ where: { id: contact.id } });
        } else {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              phone: match.realPhone,
              whatsappLid: phone,
              name: (contact.name && !contact.name.includes("@lid") && contact.name !== "Cliente WhatsApp") ? contact.name : match.name,
              avatarUrl: contact.avatarUrl || match.avatar
            }
          });
          console.log(" -> Contato atualizado com sucesso para:", match.realPhone);
        }
        updated++;
      }
    }
  }

  console.log("=== RECONCILIAÇÃO CONCLUÍDA! Total atualizados:", updated, "===");
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
