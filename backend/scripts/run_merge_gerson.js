const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeGerson() {
  const masterContactId = 'a6616b54-32a3-4896-856a-ac9fdc46b59d'; // Gerson Henrique
  const duplicateContactId = '7c32daa8-05cd-4a31-a5b4-0f1cdc501d9f'; // Gerson Agelune📖
  const masterConvId = '24110053-73f0-45ed-8c01-abf223e631d9';
  const duplicateConvId = '48ac365f-0fb5-457f-86ea-550dd5b8aa7d';

  console.log('--- INICIANDO MERGE SEGURO DE GERSON ---');

  await prisma.$transaction(async (tx) => {
    // 1. Move todas as mensagens da conversa duplicada para a conversa master
    const movedMsgs = await tx.message.updateMany({
      where: { conversationId: duplicateConvId },
      data: {
        conversationId: masterConvId,
        contactId: masterContactId
      }
    });
    console.log(\`Mensagens movidas da conversa duplicada: \${movedMsgs.count}\`);

    // 2. Move qualquer mensagem solta apontando para o contactId duplicado
    const movedOtherMsgs = await tx.message.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: masterContactId, conversationId: masterConvId }
    });
    console.log(\`Outras mensagens reatribuídas: \${movedOtherMsgs.count}\`);

    // 3. Move deals
    await tx.deal.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: masterContactId }
    });

    // 4. Move tickets
    await tx.supportTicket.updateMany({
      where: { contactId: duplicateContactId },
      data: { contactId: masterContactId }
    });

    // 5. Exclui conversa duplicada
    await tx.conversation.delete({
      where: { id: duplicateConvId }
    });
    console.log(\`Conversa duplicada \${duplicateConvId} excluída.\`);

    // 6. Exclui contato duplicado
    await tx.contact.delete({
      where: { id: duplicateContactId }
    });
    console.log(\`Contato duplicado \${duplicateContactId} excluído.\`);

    // 7. Atualiza conversa master para garantir ordenação e timestamp atual
    await tx.conversation.update({
      where: { id: masterConvId },
      data: { updatedAt: new Date() }
    });
  });

  // Verifica resultado final
  const finalConv = await prisma.conversation.findUnique({
    where: { id: masterConvId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, content: true, direction: true, fromMe: true, createdAt: true }
      }
    }
  });

  console.log('--- CONVERSA MASTER UNIFICADA ---');
  console.log('Contato:', finalConv.contact.name, finalConv.contact.phone);
  console.log('Total de mensagens:', finalConv.messages.length);
  finalConv.messages.forEach(m => {
    const time = new Date(m.createdAt).toLocaleTimeString('pt-BR');
    console.log(\`[\${time}] [\${m.direction}] \${m.fromMe ? 'Atendente' : 'Cliente'}: \${m.content || '[mídia]'}\`);
  });

  await prisma.$disconnect();
}

mergeGerson().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/merge_gerson.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/merge_gerson.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
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

