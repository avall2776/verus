const { Client } = require('ssh2');

const scriptCode = `
const axios = require('/root/verus/backend/node_modules/axios');

async function checkSent() {
  // Consultar mensagens na instância versus_dfd8dbc7b0_e237492e8c
  try {
    const res = await axios.post('http://localhost:8080/chat/findMessages/versus_dfd8dbc7b0_e237492e8c', {
      where: {
        key: {
          remoteJid: '555491109159@s.whatsapp.net'
        }
      }
    }, { headers: { apikey: 'verto123' }, timeout: 5000 });

    if (Array.isArray(res.data)) {
      console.log('Total msgs encontradas:', res.data.length);
      const last3 = res.data.slice(-3);
      console.log('Últimas 3 msgs:', JSON.stringify(last3, null, 2));
    } else {
      console.log('Resposta findMessages:', res.data);
    }
  } catch (e) {
    console.error('Erro findMessages:', e.message, e.response?.data);
  }
}

checkSent().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_sent_details.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_sent_details.js', (err, stream) => {
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

