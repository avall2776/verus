const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { WhatsappService } = require('/root/verus/backend/dist/src/modules/whatsapp/whatsapp.service');

async function test() {
  const service = new WhatsappService(prisma, null, null);
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const instance = 'versus_fc89e34b2b_babdc262eb';
  
  console.log('Testing resolution for 90001878609962@lid:');
  const res = await service.resolveContactFromEvolution(tenantId, instance, '90001878609962@lid', undefined, null);
  console.log('Result:', JSON.stringify(res, null, 2));

  console.log('Testing resolution for 274766288166951@lid:');
  const res2 = await service.resolveContactFromEvolution(tenantId, instance, '274766288166951@lid', undefined, null);
  console.log('Result 2:', JSON.stringify(res2, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/test_resolve.js');
    stream.write(scriptContent);
    stream.end(() => {
      conn.exec('cd /root/verus/backend && NODE_PATH=/root/verus/backend/node_modules node /tmp/test_resolve.js', (err, proc) => {
        if (err) throw err;
        proc.on('close', () => conn.end())
          .on('data', d => process.stdout.write(d))
          .stderr.on('data', d => process.stderr.write(d));
      });
    });
  });
}).on('error', console.error).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
