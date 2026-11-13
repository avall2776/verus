const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  console.log('=== 1. MENSAGENS COM STATUS PENDING / FAILED / ERROR DE HOJE ===');
  const stuckMessages = await prisma.message.findMany({
    where: {
      createdAt: { gte: startOfDay },
      status: { in: ['pending', 'failed', 'error'] }
    },
    include: {
      conversation: {
        include: {
          contact: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total de mensagens travadas/falhas hoje:', stuckMessages.length);
  for (const m of stuckMessages) {
    console.log(\`  [\${m.direction}] [\${m.status}] [\${m.createdAt.toISOString()}] ID: \${m.id}\`);
    console.log(\`    Contato: \${m.conversation?.contact?.name} (\${m.conversation?.contact?.phone})\`);
    console.log(\`    Conteúdo: \${(m.content || m.mediaUrl || '').substring(0, 80)}\`);
  }

  console.log('\\n=== 2. CONTATOS COM @LID CRIADOS OU ATUALIZADOS HOJE (POTENCIAIS MENSAGENS ISOLADAS) ===');
  const lidContacts = await prisma.contact.findMany({
    where: {
      phone: { contains: 'lid' },
      createdAt: { gte: startOfDay }
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });
  console.log('Total de contatos @lid isolados hoje:', lidContacts.length);
  for (const c of lidContacts) {
    console.log(\`  Contato LID: \${c.id} | \${c.name} | \${c.phone}\`);
    for (const conv of c.conversations) {
      console.log(\`    Conv: \${conv.id} (\${conv.messages.length} msgs):\`);
      for (const m of conv.messages) {
        console.log(\`      [\${m.direction}] [\${m.createdAt.toISOString()}] \${m.content}\`);
      }
    }
  }

  console.log('\\n=== 3. CONVERSAS EM "AGUARDANDO" HOJE COM CLIENTES SEM RESPOSTA ===');
  const waitingConvs = await prisma.conversation.findMany({
    where: {
      status: 'waiting',
      updatedAt: { gte: startOfDay }
    },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 15
  });
  console.log('Conversas aguardando mais recentes (até 15):', waitingConvs.length);
  for (const conv of waitingConvs) {
    const lastMsg = conv.messages[0];
    console.log(\`  [\${conv.id}] \${conv.contact?.name} (\${conv.contact?.phone}) | Atualizado: \${conv.updatedAt.toISOString()}\`);
    if (lastMsg) {
      console.log(\`    Última Msg [\${lastMsg.direction}]: \${lastMsg.content?.substring(0, 70)}\`);
    }
  }

  console.log('\\n=== 4. TOTAL DE MENSAGENS PROCESSADAS HOJE ===');
  const totalInbound = await prisma.message.count({
    where: { createdAt: { gte: startOfDay }, direction: 'INBOUND' }
  });
  const totalOutbound = await prisma.message.count({
    where: { createdAt: { gte: startOfDay }, direction: 'OUTBOUND' }
  });
  console.log(\`Total recebidas hoje (INBOUND): \${totalInbound}\`);
  console.log(\`Total enviadas hoje (OUTBOUND): \${totalOutbound}\`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/audit_unsent_and_received.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/audit_unsent_and_received.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
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

