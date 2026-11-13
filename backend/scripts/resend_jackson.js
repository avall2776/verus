const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function main() {
  const msg = await prisma.message.findUnique({
    where: { id: 'fcdee634-7141-4299-800d-c5d23aac1906' }
  });
  console.log('Mensagem de Jackson Sousa:', msg?.id, msg?.status, msg?.content);

  // Disparar envio via Evolution API
  const url = 'http://localhost:8080/message/sendText/versus_fc89e34b2b_babdc262eb';
  try {
    const res = await axios.post(url, {
      number: '5593992351227',
      options: { delay: 1200, presence: 'composing' },
      textMessage: { text: msg.content }
    }, {
      headers: { apikey: 'verto123', 'Content-Type': 'application/json' }
    });
    console.log('Envio realizado:', res.data);
    const messageId = res.data?.key?.id || res.data?.id;
    if (messageId) {
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: 'sent',
          providerMessageId: messageId
        }
      });
      console.log('Mensagem atualizada para sent com sucesso!');
    }
  } catch (err) {
    console.error('Erro ao enviar:', err.response?.data || err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/resend_jackson.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/resend_jackson.js', (err, stream) => {
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

