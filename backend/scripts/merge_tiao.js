const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const janainaId = '43e3ab2e-72c4-4518-8509-9685a8edd986';
  const targetContactId = '7d54bea2-c164-4666-96fa-03a7e6fe0868';
  const targetConvId = '5d2ef975-32d2-4027-bcb4-e5908bbe77e7';
  const lidContactId = 'cc0d7a32-daa1-4fb7-b66e-07caa65f4a5d';
  const emptyContactId = 'f1d85c8f-2580-4d86-9593-1ed81bfbd6c6';
  const deptId = '3c2d4199-baa6-4fa1-a3f7-13fd4d9b8ac6'; // Região 2

  console.log('=== INICIANDO CONSOLIDAÇÃO DO TIÃO ===');

  // 1. Mover mensagens da conversa órfã para a conversa principal
  const moveRes = await prisma.message.updateMany({
    where: { contactId: lidContactId },
    data: {
      contactId: targetContactId,
      conversationId: targetConvId
    }
  });
  console.log('Mensagens migradas de cc0d7a32...:', moveRes.count);

  // 2. Remover conversa antiga vazia
  await prisma.conversation.deleteMany({
    where: { id: 'b588ae43-4622-4deb-aa36-56233ce2b70d' }
  });
  console.log('Conversa antiga excluída.');

  // 3. Deletar contatos duplicados órfãos
  await prisma.contact.deleteMany({
    where: { id: { in: [lidContactId, emptyContactId] } }
  });
  console.log('Contatos duplicados excluídos.');

  // 4. Atualizar o contato principal: Nome = "Tião"
  const updatedContact = await prisma.contact.update({
    where: { id: targetContactId },
    data: {
      name: 'Tião',
      phone: '5567981363966',
      whatsappLid: '8783325601805@lid',
      updatedAt: new Date()
    }
  });
  console.log('Contato principal atualizado:', updatedContact.id, updatedContact.name, updatedContact.phone);

  // 5. Atualizar conversa principal: Janaina + Região 2 + status human_takeover
  const updatedConv = await prisma.conversation.update({
    where: { id: targetConvId },
    data: {
      assignedTo: janainaId,
      departmentId: deptId,
      status: 'human_takeover',
      updatedAt: new Date()
    }
  });
  console.log('Conversa principal atualizada:', updatedConv.id, 'AssignedTo:', updatedConv.assignedTo);

  // 6. Atualizar Deal vinculado para Janaina
  const deal = await prisma.deal.findFirst({
    where: { contactId: targetContactId }
  });
  if (deal) {
    await prisma.deal.update({
      where: { id: deal.id },
      data: {
        title: 'Tião',
        assignedTo: janainaId
      }
    });
    console.log('Deal atualizado para Janaina:', deal.id);
  }

  // 7. Contagem final de mensagens na conversa
  const totalMsgs = await prisma.message.count({
    where: { conversationId: targetConvId }
  });
  console.log('TOTAL FINAL DE MENSAGENS NA CONVERSA DO TIÃO:', totalMsgs);

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/merge_tiao.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/merge_tiao.js', (err, stream) => {
        if (err) throw err;
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
