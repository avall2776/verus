const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeContacts(lidContactId, realContactId, finalName, lidString) {
  console.log(\`Mesclando LID \${lidContactId} -> Real \${realContactId} (\${finalName})\`);

  await prisma.contact.update({
    where: { id: realContactId },
    data: {
      whatsappLid: lidString,
      ...(finalName ? { name: finalName } : {})
    }
  });

  const realConv = await prisma.conversation.findFirst({
    where: { contactId: realContactId },
    orderBy: { updatedAt: 'desc' }
  });

  const lidConvs = await prisma.conversation.findMany({
    where: { contactId: lidContactId }
  });

  if (realConv) {
    for (const lidConv of lidConvs) {
      const moved = await prisma.message.updateMany({
        where: { conversationId: lidConv.id },
        data: {
          conversationId: realConv.id,
          contactId: realContactId
        }
      });
      console.log(\`  Movidas \${moved.count} mensagens da conv \${lidConv.id} para \${realConv.id}\`);
      await prisma.conversation.delete({ where: { id: lidConv.id } }).catch(console.error);
    }

    const lastMsg = await prisma.message.findFirst({
      where: { conversationId: realConv.id },
      orderBy: { createdAt: 'desc' }
    });

    if (lastMsg) {
      await prisma.conversation.update({
        where: { id: realConv.id },
        data: {
          updatedAt: lastMsg.createdAt,
          status: lastMsg.direction === 'INBOUND' ? 'waiting' : 'human_takeover'
        }
      });
    }
  }

  await prisma.contact.delete({ where: { id: lidContactId } }).catch(console.error);
  console.log(\`Contato LID \${lidContactId} finalizado com sucesso.\`);
}

async function main() {
  console.log('=== 1. MESCLANDO RODRIGO DIAS ===');
  // LID: 527d82d8-c311-4fca-a9c1-f9a5766139ff (195640625778752@lid)
  // REAL: 6d353f82-cdae-453f-ba1a-cbe753931f0c (+5591993495952)
  await mergeContacts(
    '527d82d8-c311-4fca-a9c1-f9a5766139ff',
    '6d353f82-cdae-453f-ba1a-cbe753931f0c',
    'Rodrigo Dias',
    '195640625778752@lid'
  );

  console.log('=== 2. MESCLANDO SALVADOR NATAL GAIDA ===');
  // LID: 99792224-6a9e-4a4e-915e-74c163150241 (99948888600667@lid)
  // REAL: 9a41fd7d-b7f2-4c11-80f6-a03f0b823041 (+5593974008492)
  await mergeContacts(
    '99792224-6a9e-4a4e-915e-74c163150241',
    '9a41fd7d-b7f2-4c11-80f6-a03f0b823041',
    'Salvador Natal Gaida',
    '99948888600667@lid'
  );

  console.log('=== TUDO MESCLADO COM SUCESSO! ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/run_second_merge.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/run_second_merge.js', (err, stream) => {
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

