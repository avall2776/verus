const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const inst = await prisma.whatsAppInstance.findUnique({
    where: { id: 'babdc262-ebd6-49ac-938c-d1952c633c98' }
  });
  if (inst) {
    const newSettings = Object.assign({}, inst.settings || {}, { apiKey: 'verto123' });
    await prisma.whatsAppInstance.update({
      where: { id: inst.id },
      data: { token: 'verto123', settings: newSettings }
    });
    console.log('API Key da instancia Verto corrigida para verto123!');
  }
  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/fix_inst_key.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/fix_inst_key.js', (err, stream) => {
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

