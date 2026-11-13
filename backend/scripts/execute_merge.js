const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeContacts(lidContactId, realContactId, finalName, lidString) {
  console.log(\`Mesclando LID \${lidContactId} -> Real \${realContactId} (\${finalName})\`);

  // 1. Atualizar contato real com o LID e nome final se aplicável
  await prisma.contact.update({
    where: { id: realContactId },
    data: {
      whatsappLid: lidString,
      ...(finalName ? { name: finalName } : {})
    }
  });

  // 2. Mover mensagens da conversa LID para a conversa Real
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

      // Deletar conv LID
      await prisma.conversation.delete({ where: { id: lidConv.id } }).catch(console.error);
    }

    // Atualizar última mensagem da conversa real
    const lastMsg = await prisma.message.findFirst({
      where: { conversationId: realConv.id },
      orderBy: { createdAt: 'desc' }
    });

    if (lastMsg) {
      await prisma.conversation.update({
        where: { id: realConv.id },
        data: {
          updatedAt: lastMsg.createdAt,
          status: 'waiting' // volta para aguardando pois o cliente respondeu!
        }
      });
    }
  }

  // 3. Deletar contato LID duplicado
  await prisma.contact.delete({ where: { id: lidContactId } }).catch(console.error);
  console.log(\`Contato LID \${lidContactId} deletado com sucesso.\`);
}

async function main() {
  console.log("=== MESCLANDO CASO 1: ALE / JOSNHERTH ===");
  await mergeContacts(
    '687b1e52-3aec-46c3-87fe-17aeed9d37f3',
    '7de08a1a-acf4-4a9c-b327-e39fbd55e161',
    'Ale (Josnherth)',
    '254945752314082@lid'
  );

  console.log("=== MESCLANDO CASO 2: SILVIO SANTANA ===");
  await mergeContacts(
    '810445ec-0c86-43f3-960a-994c3b7fed4d',
    '10177ff4-5bc5-4526-b8a1-b1a5e3c40cd8',
    'Silvio Santana Marques',
    '34712093491442@lid'
  );

  console.log("=== MESCLAGEM CONCLUIDA! ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/run_merge_now.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/run_merge_now.js', (err, stream) => {
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
