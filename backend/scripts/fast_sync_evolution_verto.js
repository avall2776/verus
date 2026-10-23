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

  console.log("=== SINCRONIZAÇÃO EM ALTA VELOCIDADE (VERTO) ===");
  const t0 = Date.now();

  // 1. Busca contatos da Evolution API
  const evoRes = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" },
    timeout: 10000
  });
  const evoContacts = evoRes.data || [];
  console.log("Total contatos da Evolution:", evoContacts.length);

  // 2. Carrega todos os contatos existentes do tenant Verto em 1 query
  const existingContacts = await prisma.contact.findMany({
    where: { tenantId: vertoId },
    select: { id: true, name: true, phone: true, avatarUrl: true, whatsappLid: true }
  });
  console.log("Total contatos existentes no banco:", existingContacts.length);

  const dbPhoneMap = new Map();
  for (const c of existingContacts) {
    if (c.phone) {
      const clean = c.phone.replace(/\\D/g, "");
      if (clean && !c.phone.includes("@lid")) {
        dbPhoneMap.set(clean, c);
      }
    }
  }

  const toCreate = [];
  const toUpdate = [];

  for (const ec of evoContacts) {
    if (!ec.id || ec.id.includes("@lid")) continue;
    const cleanPhone = ec.id.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/\\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 13) continue;

    const rawName = (ec.pushName || ec.name || "").trim();
    const isGeneric = !rawName || rawName === "." || rawName === "-" || /^\\d+$/.test(rawName) || rawName.includes("WhatsApp");
    const photoUrl = ec.profilePictureUrl || null;

    if (dbPhoneMap.has(cleanPhone)) {
      const existing = dbPhoneMap.get(cleanPhone);
      const curNameGeneric = !existing.name || existing.name === "." || existing.name === "-" || /^\\d+$/.test(existing.name.trim()) || existing.name.includes("WhatsApp") || existing.name === "Cliente WhatsApp";

      const updates = {};
      if (curNameGeneric && !isGeneric) {
        updates.name = rawName;
      }
      if (!existing.avatarUrl && photoUrl) {
        updates.avatarUrl = photoUrl;
      }
      if (Object.keys(updates).length > 0) {
        toUpdate.push({ id: existing.id, updates });
      }
    } else {
      const finalName = !isGeneric ? rawName : ("WhatsApp (" + cleanPhone + ")");
      toCreate.push({
        tenantId: vertoId,
        phone: cleanPhone,
        name: finalName,
        avatarUrl: photoUrl,
        source: "WhatsApp Agenda"
      });
      // Adiciona no mapa para não duplicar se a agenda tiver entradas repetidas
      dbPhoneMap.set(cleanPhone, { id: "temp", name: finalName, phone: cleanPhone, avatarUrl: photoUrl });
    }
  }

  console.log("Novos contatos a criar:", toCreate.length);
  console.log("Contatos existentes a enriquecer:", toUpdate.length);

  // 3. Inserção em massa (createMany)
  if (toCreate.length > 0) {
    // Dividir em lotes de 500 para segurança
    for (let i = 0; i < toCreate.length; i += 500) {
      const batch = toCreate.slice(i, i + 500);
      await prisma.contact.createMany({
        data: batch,
        skipDuplicates: true
      });
    }
    console.log("✅ Inseridos", toCreate.length, "contatos com sucesso!");
  }

  // 4. Atualização dos contatos com nome/foto enriquecidos
  if (toUpdate.length > 0) {
    for (const item of toUpdate) {
      await prisma.contact.update({
        where: { id: item.id },
        data: item.updates
      });
    }
    console.log("✅ Enriquecidos", toUpdate.length, "contatos existentes!");
  }

  // 5. Reconciliação dos contatos com LID
  console.log("\\n=== RECONCILIAÇÃO DE CONTATOS LID ===");
  const refreshedContacts = await prisma.contact.findMany({
    where: { tenantId: vertoId }
  });

  const photoMap = new Map();
  const nameMap = new Map();

  for (const c of refreshedContacts) {
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

  const lidContacts = refreshedContacts.filter(c => c.phone && c.phone.includes("@lid"));
  console.log("Contatos com LID a reconciliar:", lidContacts.length);

  let lidReconciled = 0;
  for (const lc of lidContacts) {
    let matchedReal = null;
    let matchType = "";

    // Match por foto
    if (lc.avatarUrl) {
      const pid = extractPhotoId(lc.avatarUrl);
      if (pid && photoMap.has(pid)) {
        matchedReal = photoMap.get(pid);
        matchType = "FOTO";
      }
    }

    // Match por nome
    if (!matchedReal && lc.name && lc.name.length >= 4 && !/^\\d+$/.test(lc.name)) {
      const norm = normalizeName(lc.name);
      if (nameMap.has(norm)) {
        matchedReal = nameMap.get(norm);
        matchType = "NOME";
      }
    }

    if (matchedReal && matchedReal.id !== lc.id) {
      console.log("LID [" + lc.id + "] (" + lc.name + ") -> " + matchType + " -> [" + matchedReal.id + "] (" + matchedReal.name + " - " + matchedReal.phone + ")");
      // Migrar conversas
      await prisma.conversation.updateMany({
        where: { contactId: lc.id },
        data: { contactId: matchedReal.id }
      });
      // Salvar LID no contato real
      await prisma.contact.update({
        where: { id: matchedReal.id },
        data: { whatsappLid: lc.phone }
      });
      // Remover contato LID órfão
      await prisma.contact.delete({ where: { id: lc.id } }).catch(() => {});
      lidReconciled++;
    }
  }

  console.log("Total LIDs reconciliados:", lidReconciled);
  console.log("Tempo total de execução:", ((Date.now() - t0) / 1000).toFixed(2), "s");

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
