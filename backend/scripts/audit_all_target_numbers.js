const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const searchPatterns = [
    { label: "53 9930-3617", pattern: "9930" },
    { label: "51 9871-3884", pattern: "9871" },
    { label: "98 8557-1552", pattern: "8557" },
    { label: "51 9970-9142", pattern: "9970" },
    { label: "86 9454-2567", pattern: "9454" },
    { label: "91 8163-1508", pattern: "8163" },
    { label: "96 9116-3279", pattern: "9116" },
    { label: "62 8532-3212", pattern: "8532" },
    { label: "Jonatan Biazzi", pattern: "Biazzi" },
    { label: "68 9229-9461", pattern: "9229" },
    { label: "65 8478-8001", pattern: "8478" },
    { label: "94 9237-1177", pattern: "9237" },
    { label: "Alexandro Lavagem", pattern: "Alexandro" },
    { label: "42 9916-8982", pattern: "99168982" },
    { label: "64 9949-1700", pattern: "99491700" }
  ];

  console.log("=== RELATÓRIO DE STATUS DAS MENSAGENS DOS NÚMEROS ===");

  for (const item of searchPatterns) {
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { phone: { contains: item.pattern } },
          { name: { contains: item.pattern, mode: 'insensitive' } },
          { whatsappLid: { contains: item.pattern } }
        ]
      },
      select: { id: true, name: true, phone: true, whatsappLid: true }
    });

    if (contacts.length === 0) {
      console.log("\\n[!] " + item.label + ": Nenhum contato encontrado no banco.");
      continue;
    }

    for (const c of contacts) {
      console.log("\\n--------------------------------------------------");
      console.log("Contato: " + c.name + " | Tel: " + c.phone + " | LID: " + (c.whatsappLid || 'N/A'));
      
      const msgs = await prisma.message.findMany({
        where: { contactId: c.id },
        orderBy: { createdAt: 'desc' },
        take: 4,
        select: { id: true, direction: true, status: true, type: true, content: true, mediaUrl: true, createdAt: true }
      });

      if (msgs.length === 0) {
        console.log("  Nenhuma mensagem registrada.");
      } else {
        for (const m of msgs) {
          const time = m.createdAt.toLocaleTimeString('pt-BR');
          const date = m.createdAt.toLocaleDateString('pt-BR');
          console.log("  [" + date + " " + time + "] " + m.direction + " | status=" + m.status + " | type=" + m.type + " | " + (m.content ? m.content.substring(0, 45) : (m.mediaUrl ? m.mediaUrl.substring(0, 45) : '')));
        }
      }
    }
  }

  console.log("\\n=== TODAS AS MENSAGENS OUTBOUND HOJE COM FALHA OU PENDENTE ===");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const failed = await prisma.message.findMany({
    where: {
      createdAt: { gte: today },
      direction: 'OUTBOUND',
      status: { in: ['failed', 'error', 'pending'] }
    },
    include: {
      contact: { select: { name: true, phone: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 30
  });

  console.log("Total de falhas registradas hoje:", failed.length);
  for (const f of failed) {
    console.log("  " + (f.contact?.phone || 'sem tel') + " (" + (f.contact?.name || 'sem nome') + "): status=" + f.status + " | " + f.content.substring(0, 50));
  }

  await prisma.$disconnect();
}
run().catch(console.error);
`;

  conn.exec(`cat << 'EOF' > /root/verus/backend/audit_numbers_report.js\n${code}\nEOF\ncd /root/verus/backend && node audit_numbers_report.js`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
