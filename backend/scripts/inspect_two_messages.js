const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const phones = ['81101375', '84841099'];
  console.log('=== BUSCANDO CONTATOS ===');
  for (const p of phones) {
    const contacts = await prisma.contact.findMany({
      where: { phone: { contains: p } },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        }
      }
    });

    console.log('TELEFONE DIGITOS:', p, 'Encontrados:', contacts.length);
    for (const c of contacts) {
      console.log('--- Contato:', c.id, c.name, c.phone, 'Tenant:', c.tenantId);
      console.log('Conversations count:', c.conversations.length);
      for (const conv of c.conversations) {
        console.log('  Conv ID:', conv.id, 'Status:', conv.status, 'assignedTo:', conv.assignedTo, 'deptId:', conv.departmentId, 'unreadCount:', conv.unreadCount);
        console.log('  Mensagens recentes (' + conv.messages.length + '):');
        for (const m of conv.messages) {
          console.log('    [' + m.direction + '] [' + m.status + '] [' + m.createdAt.toISOString() + '] ' + m.type + ' -> ' + (m.content || m.mediaUrl || '').substring(0, 80));
        }
      }
    }
  }

  // Verificar configuracao de IA do tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'verto' },
    include: {
      aiAgentConfig: true
    }
  });
  console.log('=== CONFIG IA DO TENANT ===');
  console.log('Tenant:', tenant?.id, tenant?.name);
  console.log('AI Agent Config:', tenant?.aiAgentConfig);
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_debug.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      console.log('Script uploaded to VPS. Executing...');
      conn.exec('cd /root/verus/backend && node scripts/inspect_debug.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
          console.log('\nRemote inspect finished with exit code ' + code);
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
