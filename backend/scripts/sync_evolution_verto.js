const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

function extractPhotoId(url) {
  if (!url) return null;
  const match = url.match(/\\/([^\\/?]+)\\.(?:jpg|jpeg|png|webp)/i);
  return match ? match[1] : null;
}

function normalizeName(str) {
  return (str || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function run() {
  const vertoId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";
  const instName = "versus_fc89e34b2b_babdc262eb";

  console.log("=== SINCRONIZANDO AGENDA EVOLUTION PARA VERTO ===");
  const evoRes = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  const evoContacts = evoRes.data || [];
  console.log("Total contatos recebidos da Evolution:", evoContacts.length);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const ec of evoContacts) {
    if (!ec.id || ec.id.includes("@lid")) continue;
    const cleanPhone = ec.id.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/\\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 13) continue;

    const rawName = (ec.pushName || ec.name || "").trim();
    const isGenericName = !rawName || rawName === "." || rawName === "-" || /^\\d+$/.test(rawName) || rawName.includes("WhatsApp");
    const photoUrl = ec.profilePictureUrl || null;

    // Buscar contato no banco
    const existing = await prisma.contact.findFirst({
      where: {
        tenantId: vertoId,
        phone: cleanPhone
      }
    });

    if (existing) {
      // Atualizar se o nome no banco for genérico/numérico ou se tiver foto nova
      const existingNameGeneric = !existing.name || existing.name === "." || existing.name === "-" || /^\\d+$/.test(existing.name.trim()) || existing.name.includes("WhatsApp") || existing.name === "Cliente WhatsApp";
      
      const updateData = {};
      if (existingNameGeneric && !isGenericName) {
        updateData.name = rawName;
      }
      if (!existing.avatarUrl && photoUrl) {
        updateData.avatarUrl = photoUrl;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: updateData
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      // Criar novo contato vindo da agenda do WhatsApp
      const finalName = !isGenericName ? rawName : ("WhatsApp (" + cleanPhone + ")");
      await prisma.contact.create({
        data: {
          tenantId: vertoId,
          phone: cleanPhone,
          name: finalName,
          avatarUrl: photoUrl,
          source: "WhatsApp Agenda"
        }
      });
      createdCount++;
    }
  }

  console.log("Resultado da Sincronização:");
  console.log("  Criados novos contatos:", createdCount);
  console.log("  Atualizados contatos existentes:", updatedCount);
  console.log("  Inalterados:", skippedCount);

  // Agora vamos verificar os contatos com LID
  console.log("\\n=== RECONCILIAÇÃO DE CONTATOS LID ===");
  const allDbContacts = await prisma.contact.findMany({
    where: { tenantId: vertoId }
  });

  const photoMap = new Map();
  const nameMap = new Map();

  for (const c of allDbContacts) {
    if (!c.phone || c.phone.includes("@lid")) continue;
    const digits = c.phone.replace(/\\D/g, "");
    if (digits.length < 10 || digits.length > 13) continue;

    const pid = extractPhotoId(c.avatarUrl);
    if (pid) photoMap.set(pid, c);

    const norm = normalizeName(c.name);
    if (norm && norm.length >= 4 && !/^\\d+$/.test(c.name)) {
      nameMap.set(norm, c);
    }
  }

  const lidContacts = allDbContacts.filter(c => c.phone && c.phone.includes("@lid"));
  console.log("Contatos com LID a reconciliar:", lidContacts.length);

  let lidReconciled = 0;
  for (const lc of lidContacts) {
    let matchedRealContact = null;
    let reason = "";

    // A. Match por foto
    if (lc.avatarUrl) {
      const pid = extractPhotoId(lc.avatarUrl);
      if (pid && photoMap.has(pid)) {
        matchedRealContact = photoMap.get(pid);
        reason = "FOTO";
      }
    }

    // B. Match por nome
    if (!matchedRealContact && lc.name && lc.name.length >= 4 && !/^\\d+$/.test(lc.name)) {
      const norm = normalizeName(lc.name);
      if (nameMap.has(norm)) {
        matchedRealContact = nameMap.get(norm);
        reason = "NOME";
      }
    }

    if (matchedRealContact) {
      console.log("LID [" + lc.id + "] (" + lc.name + ") -> MATCH com [" + matchedRealContact.id + "] (" + matchedRealContact.name + ", " + matchedRealContact.phone + ") via " + reason);

      // 1. Migrar conversas do contato LID para o contato real
      const updatedConvs = await prisma.conversation.updateMany({
        where: { contactId: lc.id },
        data: { contactId: matchedRealContact.id }
      });

      // 2. Salvar o whatsappLid no contato real
      await prisma.contact.update({
        where: { id: matchedRealContact.id },
        data: { whatsappLid: lc.phone }
      });

      // 3. Deletar ou marcar o contato LID antigo
      await prisma.contact.delete({
        where: { id: lc.id }
      }).catch(e => console.log("Erro ao deletar contato LID antigo:", e.message));

      lidReconciled++;
    }
  }

  console.log("Total de LIDs reconciliados e migrados:", lidReconciled);

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
