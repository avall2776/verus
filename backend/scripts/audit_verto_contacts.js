const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteCmd = `
node -e '
const { PrismaClient } = require("/root/verus/backend/node_modules/@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const vertoId = "fc89e34b-2bc5-462d-9bfd-45b06e1d0126";

  const allContacts = await prisma.contact.findMany({
    where: { tenantId: vertoId },
    select: { id: true, name: true, phone: true, whatsappLid: true }
  });

  console.log("Total contatos no Verto:", allContacts.length);

  let withLidPhone = 0;
  let genericNames = 0;
  let dotNames = 0;
  let numericNames = 0;
  let realE164Phones = 0;

  for (const c of allContacts) {
    if (c.phone && c.phone.includes("@lid")) withLidPhone++;
    const digits = (c.phone || "").replace(/\\D/g, "");
    if (digits.length >= 10 && digits.length <= 13 && !c.phone?.includes("@lid")) realE164Phones++;

    const name = (c.name || "").trim();
    if (name === "." || name === "-") dotNames++;
    if (/^\\d+$/.test(name)) numericNames++;
    if (name.includes("WhatsApp") || name === "Cliente WhatsApp") genericNames++;
  }

  console.log("Com telefone @lid:", withLidPhone);
  console.log("Com telefone E.164 real:", realE164Phones);
  console.log("Com nome ponto (.):", dotNames);
  console.log("Com nome numérico (apenas números):", numericNames);
  console.log("Com nome genérico WhatsApp:", genericNames);

  // Analisar as conversas do Verto
  const convs = await prisma.conversation.findMany({
    where: { tenantId: vertoId },
    include: {
      contact: true
    }
  });
  console.log("Total conversas no Verto:", convs.length);

  let convsWithBadContact = 0;
  for (const cv of convs) {
    const c = cv.contact;
    const name = (c?.name || "").trim();
    const phone = c?.phone || "";
    if (phone.includes("@lid") || name === "." || /^\\d+$/.test(name) || name.includes("WhatsApp")) {
      convsWithBadContact++;
    }
  }
  console.log("Conversas com contato problemático (LID, ponto, numérico, genérico):", convsWithBadContact);

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
