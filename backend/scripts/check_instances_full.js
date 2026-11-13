const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const instances = await prisma.whatsAppInstance.findMany({
    include: { tenant: { select: { id: true, name: true } } }
  });
  console.log(JSON.stringify(instances.map(i => ({
    id: i.id,
    name: i.name,
    status: i.status,
    phone: i.phoneNumberId || (i.settings && i.settings.phoneNumber),
    tenantName: i.tenant?.name,
    tenantId: i.tenantId,
    instanceName: i.settings?.instanceName,
    settings: i.settings
  })), null, 2));
  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_inst.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_inst.js', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});
