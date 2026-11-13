const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const msg = await prisma.message.findFirst({
    where: {
      content: { contains: "400 hectares" }
    },
    include: {
      contact: true,
      conversation: true
    }
  });

  console.log("Contact found:", JSON.stringify(msg?.contact));
  console.log("Conversation:", JSON.stringify(msg?.conversation));

  if (msg?.contactId) {
    const allMsgs = await prisma.message.findMany({
      where: { contactId: msg.contactId },
      orderBy: { createdAt: 'asc' },
      take: 30
    });
    console.log("\\nAll messages for this contact:");
    for (const m of allMsgs) {
      console.log("  [" + m.createdAt.toISOString() + "] " + m.direction + " | type=" + m.type + " | status=" + m.status + " | mediaUrl=" + m.mediaUrl + " | " + m.content);
    }
  }

  await prisma.$disconnect();
}
run().catch(console.error);
`;

  conn.exec(`cat << 'EOF' > /root/verus/backend/find_blank_client.js\n${code}\nEOF\ncd /root/verus/backend && node find_blank_client.js`, (err, stream) => {
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

