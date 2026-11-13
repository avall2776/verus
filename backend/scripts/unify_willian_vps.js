const { Client } = require('ssh2');

const remoteScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const mainContactId = 'ba6e6653-ee93-45f3-8f14-c7fbb00254fd';
  const mainConvId = '67252434-e2cb-4aac-93b1-f7da8953c29c';
  const dupContactId = 'd9c83e98-1eab-4fce-8e75-b1b3b2059258';
  const dupConvId = '36ed65cb-d4a8-41ba-a305-4ee54231a2b7';

  console.log('--- 1. Transferindo mensagens do contato duplicado para a conversa principal ---');
  const movedMsgs = await prisma.message.updateMany({
    where: { conversationId: dupConvId },
    data: {
      conversationId: mainConvId,
      contactId: mainContactId
    }
  });
  console.log('Mensagens migradas:', movedMsgs.count);

  console.log('--- 2. Obtendo avatar do contato duplicado ---');
  const dupContact = await prisma.contact.findUnique({ where: { id: dupContactId } });

  console.log('--- 3. Atualizando contato principal com whatsappLid e avatarUrl ---');
  const updatedMain = await prisma.contact.update({
    where: { id: mainContactId },
    data: {
      whatsappLid: '73444762877959@lid',
      avatarUrl: dupContact?.avatarUrl || undefined,
      updatedAt: new Date()
    }
  });
  console.log('Contato principal atualizado:', updatedMain.name, 'LID:', updatedMain.whatsappLid);

  console.log('--- 4. Atualizando data da conversa principal ---');
  await prisma.conversation.update({
    where: { id: mainConvId },
    data: { updatedAt: new Date() }
  });

  console.log('--- 5. Removendo conversa e contato duplicados ---');
  await prisma.conversation.delete({ where: { id: dupConvId } });
  await prisma.contact.delete({ where: { id: dupContactId } });
  console.log('Conversa e contato duplicados deletados com sucesso!');

  console.log('=== UNIFICAÇÃO CONCLUÍDA COM 100% DE SUCESSO ===');
  await prisma.$disconnect();
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/execute_unify_willian.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/execute_unify_willian.js', (err, stream) => {
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

