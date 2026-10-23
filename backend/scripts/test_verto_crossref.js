const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const axios = require("/root/verus/backend/node_modules/axios");
const prisma = new PrismaClient();

async function run() {
  const vertoId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";
  const instName = "versus_fc89e34b2b_babdc262eb";

  // 1. Pega contatos da Evolution API
  const evoRes = await axios.post("http://localhost:8080/chat/findContacts/" + instName, {}, {
    headers: { apikey: "verto123" }
  });
  const evoContacts = evoRes.data || [];
  console.log("Total contatos na agenda da Evolution:", evoContacts.length);

  // Mapear Evolution por telefone
  const evoPhoneMap = new Map();
  for (const ec of evoContacts) {
    if (!ec.id) continue;
    const phone = ec.id.replace("@s.whatsapp.net", "").replace("@c.us", "").replace(/\\D/g, "");
    if (phone && (ec.pushName || ec.name)) {
      evoPhoneMap.set(phone, {
        name: ec.pushName || ec.name,
        picture: ec.profilePictureUrl || null
      });
    }
  }
  console.log("Contatos com telefone e nome na Evolution:", evoPhoneMap.size);

  // 2. Buscar contatos no banco do Verto com nome numérico ou LID
  const badContacts = await prisma.contact.findMany({
    where: {
      tenantId: vertoId,
      OR: [
        { phone: { contains: "lid" } },
        { name: "." },
        { name: "-" }
      ]
    }
  });

  const numericNamed = await prisma.contact.findMany({
    where: {
      tenantId: vertoId,
      phone: { not: null }
    }
  });

  let matchNumericToEvo = 0;
  for (const c of numericNamed) {
    const isNumName = /^\\d+$/.test((c.name || "").trim());
    if (isNumName) {
      const cleanPhone = (c.phone || "").replace(/\\D/g, "");
      if (evoPhoneMap.has(cleanPhone)) {
        matchNumericToEvo++;
      }
    }
  }
  console.log("Contatos com nome puramente numérico que têm nome na Evolution:", matchNumericToEvo);

  // 3. Vamos listar 10 contatos com LID no Verto e ver quem são
  console.log("=== Amostra de contatos com LID no Verto ===");
  const sampleLids = badContacts.slice(0, 10);
  for (const sl of sampleLids) {
    console.log("Contact ID:", sl.id, "Nome:", sl.name, "Phone:", sl.phone, "whatsappLid:", sl.whatsappLid);
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
