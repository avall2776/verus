const { Client } = require('ssh2');

const scriptCode = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const axios = require('/root/verus/backend/node_modules/axios');
const prisma = new PrismaClient();

async function testDispatch() {
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const evolutionGlobalKey = process.env.EVOLUTION_API_KEY || 'verto123';
  const phone = '5554991109159';

  const cleanDigits = phone.replace(/\\D/g, '');
  const targetPhone12 = cleanDigits.length === 13 && cleanDigits.startsWith('55')
    ? cleanDigits.slice(0, 4) + cleanDigits.slice(5)
    : cleanDigits;

  console.log('Testando envio para:', targetPhone12);

  const payload = {
    number: targetPhone12,
    text: '🔐 [VALLOR SECURITY] Teste de validação 2FA: Seu código é 123456.',
    options: {
      delay: 500,
      presence: 'composing',
      linkPreview: false,
    },
    textMessage: {
      text: '🔐 [VALLOR SECURITY] Teste de validação 2FA: Seu código é 123456.',
    },
  };

  const res = await axios.post(evolutionUrl + '/message/sendText/versus_fc89e34b2b_babdc262eb', payload, {
    headers: {
      apikey: evolutionGlobalKey,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  console.log('Resultado do envio:', res.status, res.data);
  await prisma.$disconnect();
}

testDispatch().catch(e => console.error('Erro no envio:', e.message, e.response?.data));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/test_real_2fa_dispatch.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/test_real_2fa_dispatch.js', (err, stream) => {
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

