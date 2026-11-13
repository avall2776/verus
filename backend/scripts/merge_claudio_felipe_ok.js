const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const targetContactId = '98dc8704-17bd-4f9c-b5ed-f61626cf2c1b'; // Felipe Costa
  const sourceContactId = '74c0eb2b-43c5-43f8-bce1-5dfd4ffb42d4'; // Claudio (54 99110-9159)

  const targetConvId = 'da27b095-6de2-4c78-ab7c-5c27424fc9b6';
  const sourceConvId = '256ef4cb-26fa-4903-8df2-9d9f268965d6';

  console.log('--- Unificando Claudio para Felipe Costa ---');

  await prisma.$transaction(async (tx) => {
    // 1. Move todas as mensagens da conversa do Claudio para a conversa do Felipe Costa
    const movedMsgs = await tx.message.updateMany({
      where: { conversationId: sourceConvId },
      data: { conversationId: targetConvId, contactId: targetContactId }
    });
    console.log('Mensagens migradas:', movedMsgs.count);

    // 2. Move deals se houver
    const movedDeals = await tx.deal.updateMany({
      where: { contactId: sourceContactId },
      data: { contactId: targetContactId }
    });
    console.log('Negócios migrados:', movedDeals.count);

    // 3. Move supportTickets
    await tx.supportTicket.updateMany({
      where: { contactId: sourceContactId },
      data: { contactId: targetContactId }
    }).catch(() => {});

    // 4. Move CSAT surveys
    await tx.csatSurvey.updateMany({
      where: { conversationId: sourceConvId },
      data: { conversationId: targetConvId, contactId: targetContactId }
    }).catch(() => {});

    // 5. Deleta a conversa antiga do Claudio
    await tx.conversation.delete({
      where: { id: sourceConvId }
    });
    console.log('Conversa antiga do Claudio deletada.');

    // 6. Deleta o contato antigo do Claudio
    await tx.contact.delete({
      where: { id: sourceContactId }
    });
    console.log('Contato antigo do Claudio deletado.');

    // 7. Garante que Felipe Costa tenha nome correto e telefone canônico
    await tx.contact.update({
      where: { id: targetContactId },
      data: {
        name: 'Felipe Costa',
        phone: '555491109159'
      }
    });

    // 8. Atualiza updatedAt da conversa
    await tx.conversation.update({
      where: { id: targetConvId },
      data: { updatedAt: new Date() }
    });
  });

  console.log('SUCESSO: CLAUDIO UNIFICADO EM FELIPE COSTA COM TODAS AS MENSAGENS!');
  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/merge_claudio_ok.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/merge_claudio_ok.js', (err, stream) => {
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

