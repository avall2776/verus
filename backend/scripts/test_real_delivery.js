const { Client } = require('ssh2');

const remoteScript = `
const axios = require('/root/verus/backend/node_modules/axios');
async function run() {
  await new Promise(r => setTimeout(r, 4000));
  const evolutionUrl = 'http://localhost:8080';
  const evolutionGlobalKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb'; // Verto Linha Principal

  const state = await axios.get(evolutionUrl + '/instance/connectionState/' + instance, {
    headers: { apikey: evolutionGlobalKey }
  });
  console.log('State:', state.data);

  console.log('Disparando mensagem com texto real...');
  const sendRes = await axios.post(evolutionUrl + '/message/sendText/' + instance, {
    number: '555491109159',
    options: { delay: 1000, presence: 'composing', linkPreview: false },
    textMessage: { text: 'Ola Felipe! Teste de entrega com texto real. Me confirme se apareceu o texto.' }
  }, {
    headers: { apikey: evolutionGlobalKey }
  });
  console.log('SendRes:', sendRes.status, sendRes.data);
}
run().catch(e => console.error('ERRO:', e.message, e.response?.data));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/test_real_delivery.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/test_real_delivery.js', (err, stream) => {
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

