const { Client } = require('ssh2');

const scriptOnVps = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isSuperAdmin: true,
      permissions: true,
      tenantId: true,
      departments: {
        select: {
          department: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_users_details.js');
    stream.write(scriptOnVps);
    stream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_users_details.js', (err, execStream) => {
        if (err) throw err;
        execStream.on('data', d => process.stdout.write(d));
        execStream.stderr.on('data', d => process.stderr.write(d));
        execStream.on('close', () => conn.end());
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

