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

  const evoRes = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  const evoContacts = evoRes.data || [];

  const photoMap = new Map();
  const nameMap = new Map();
  const phoneMap = new Map();

  for (const ec of evoContacts) {
    if (!ec.id) continue;
    const phone = ec.id.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/\\D/g, "");
    const name = ec.pushName || ec.name;
    const photo = ec.profilePictureUrl;

    if (phone && phone.length >= 10 && phone.length <= 13) {
      phoneMap.set(phone, { phone, name, photo });
    }

    const photoId = extractPhotoId(photo);
    if (photoId && phone) {
      photoMap.set(photoId, { phone, name, photo });
    }

    const norm = normalizeName(name);
    if (norm && norm.length >= 4 && phone) {
      nameMap.set(norm, { phone, name, photo });
    }
  }

  console.log("Evolution: Total:", evoContacts.length, "Phones:", phoneMap.size, "Photos:", photoMap.size, "Names:", nameMap.size);

  // Buscar todos os contatos problemáticos do Verto
  const lidContacts = await prisma.contact.findMany({
    where: {
      tenantId: vertoId,
      OR: [
        { phone: { contains: "lid" } },
        { name: "." },
        { name: "-" }
      ]
    }
  });

  console.log("=== ANÁLISE DOS " + lidContacts.length + " CONTATOS LID/PROBLEMATICOS ===");
  for (const c of lidContacts) {
    let match = null;
    let matchType = null;

    // 1. Por telefone direto se tiver (ex: e9abf1a1 tem phone 555494028787)
    const cleanPhone = (c.phone || "").replace(/\\D/g, "");
    if (cleanPhone.length >= 10 && cleanPhone.length <= 13 && phoneMap.has(cleanPhone)) {
      match = phoneMap.get(cleanPhone);
      matchType = "TELEFONE_DIRETO";
    }

    // 2. Por foto
    if (!match && c.avatarUrl) {
      const pid = extractPhotoId(c.avatarUrl);
      if (pid && photoMap.has(pid)) {
        match = photoMap.get(pid);
        matchType = "FOTO";
      }
    }

    // 3. Por nome
    if (!match && c.name && c.name.length >= 4 && !/^\\d+$/.test(c.name)) {
      const norm = normalizeName(c.name);
      if (nameMap.has(norm)) {
        match = nameMap.get(norm);
        matchType = "NOME";
      }
    }

    console.log("Contact [" + c.id + "] Nome: " + c.name + " | Phone: " + c.phone + " -> MATCH: " + (match ? (matchType + ": " + match.phone + " (" + match.name + ")") : "NENHUM"));
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
