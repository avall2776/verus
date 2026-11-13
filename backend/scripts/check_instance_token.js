const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `cd /root/verus/backend && node -e '
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    async function run() {
      const inst = await prisma.whatsAppInstance.findUnique({
        where: { id: "babdc262-ebd6-49ac-938c-d1952c633c98" }
      });
      console.log("=== LINHA PRINCIPAL INSTANCE IN DB ===");
      console.log({
        id: inst.id,
        name: inst.name,
        token: inst.token,
        status: inst.status,
        settings: inst.settings
      });
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
