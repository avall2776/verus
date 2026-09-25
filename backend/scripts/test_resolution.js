const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const axios = require("/root/verus/backend/node_modules/axios");

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

async function testResolution() {
  const instName = "versus_c38f8968ee_1bceb585fb";
  const fc = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  const contacts = fc.data;

  // Mapas de busca
  const picToContactMap = new Map();
  const nameToContactMap = new Map();

  for (const c of contacts) {
    if (!c.id || c.id.includes("@lid")) continue;
    const realPhone = c.id.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/\\D/g, "");
    if (realPhone.length < 10) continue;

    const photoId = extractPhotoId(c.profilePictureUrl);
    if (photoId) {
      picToContactMap.set(photoId, { realPhone, name: c.pushName || c.name, profilePictureUrl: c.profilePictureUrl });
    }

    const nName = normalizeName(c.pushName || c.name);
    if (nName && nName.length >= 3) {
      nameToContactMap.set(nName, { realPhone, name: c.pushName || c.name, profilePictureUrl: c.profilePictureUrl });
    }
  }

  // Simular chegada de mensagem do Ernesto com @lid
  const incomingLid = "173680038539435@lid";
  const incomingPushName = "Ernesto Dos Santos";
  const incomingPhoto = "https://pps.whatsapp.net/v/t61.24694-24/376815496_3574026639585911_398016202290938578_n.jpg?ccb=11-4&oh=01_Q5Aa5gEHkQNCnp2R2WIJgPx5BXTmJ0riyJv-AajYLq9tNhPqyA&oe=6AC378A8&_nc_sid=5e03e0&_nc_cat=106";

  console.log("Testando resolução para:", incomingPushName, incomingLid);

  // 1. Por Foto
  const inPhotoId = extractPhotoId(incomingPhoto);
  console.log("PhotoId extraído:", inPhotoId);
  if (inPhotoId && picToContactMap.has(inPhotoId)) {
    const match = picToContactMap.get(inPhotoId);
    console.log("SUCESSO POR FOTO! Telefone encontrado:", match.realPhone, "Nome:", match.name);
  } else {
    console.log("Foto não encontrou");
  }

  // 2. Por Nome
  const inNormName = normalizeName(incomingPushName);
  console.log("Nome normalizado:", inNormName);
  let nameMatch = nameToContactMap.get(inNormName);
  if (!nameMatch) {
    // Tenta primeiro nome ou substring
    const firstName = inNormName.split(" ")[0];
    for (const [key, val] of nameToContactMap.entries()) {
      if (key === inNormName || key === firstName || (key.startsWith(firstName) && firstName.length >= 4)) {
        nameMatch = val;
        break;
      }
    }
  }
  if (nameMatch) {
    console.log("SUCESSO POR NOME! Telefone encontrado:", nameMatch.realPhone, "Nome:", nameMatch.name);
  } else {
    console.log("Nome não encontrou");
  }
}

testResolution().catch(console.error);
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
