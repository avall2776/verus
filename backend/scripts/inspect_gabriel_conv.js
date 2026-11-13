const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `cd /root/verus/backend && node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    async function run() {
      const msgs = await prisma.message.findMany({
        where: {
          content: { contains: "Falou" }
        },
        include: {
          conversation: {
            include: { contact: true }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 3
      });
      console.log("=== MSGS ENCONTRADAS ===");
      console.log(JSON.stringify(msgs.map(m => ({
        id: m.id,
        content: m.content,
        status: m.status,
        providerMessageId: m.providerMessageId,
        createdAt: m.createdAt,
        contact: {
          id: m.conversation?.contact?.id,
          name: m.conversation?.contact?.name,
          phone: m.conversation?.contact?.phone
        }
      })), null, 2));

      // Verificar instâncias cadastradas
      const instances = await prisma.whatsAppInstance.findMany();
      console.log("=== INSTANCIAS NO BANCO ===");
      console.log(JSON.stringify(instances.map(i => ({
        id: i.id,
        name: i.name,
        status: i.status,
        phoneNumber: i.phoneNumber,
        isDefault: i.isDefault,
        settings: i.settings
      })), null, 2));
    }
    run().catch(console.error).finally(() => prisma.$disconnect());
  '`;
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d))
      .stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', console.error).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
