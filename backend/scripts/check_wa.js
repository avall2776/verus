const { Client } = require('ssh2');

const scriptContent = `
const axios = require('axios');

async function main() {
  const url = 'http://localhost:8080/chat/whatsappNumbers/versus_fc89e34b2b_babdc262eb';
  try {
    const res = await axios.post(url, {
      numbers: ['5593992351227', '559392351227']
    }, {
      headers: { apikey: 'verto123', 'Content-Type': 'application/json' }
    });
    console.log('Verificação de WhatsApp:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Erro na verificação:', err.response?.data || err.message);
  }
}

main();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/check_wa_num.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/check_wa_num.js', (err, stream) => {
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

