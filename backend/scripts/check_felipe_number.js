const { Client } = require('ssh2');

const remoteScript = `
const axios = require('/root/verus/backend/node_modules/axios');
async function run() {
  const evolutionUrl = 'http://localhost:8080';
  const evolutionGlobalKey = 'verto123';
  const instance = 'versus_dfd8dbc7b0_e237492e8c'; // ou Verto

  const numbers = ['555491109159', '5554991109159'];
  console.log('Checando numeros:', numbers);
  const res = await axios.post(evolutionUrl + '/chat/whatsappNumbers/' + instance, {
    numbers
  }, {
    headers: { apikey: evolutionGlobalKey }
  });
  console.log('Resultado:', JSON.stringify(res.data, null, 2));
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_felipe.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_felipe.js', (err, stream) => {
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

