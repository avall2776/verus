const { Client } = require('ssh2');

const scriptCode = `
const axios = require('/root/verus/backend/node_modules/axios');

async function testSend() {
  const url = 'http://localhost:8080/message/sendText/versus_fc89e34b2b_babdc262eb';
  // Testar apenas verificação de número ou conexão
  const state = await axios.get('http://localhost:8080/instance/connectionState/versus_fc89e34b2b_babdc262eb', {
    headers: { apikey: 'verto123' }
  });
  console.log('Instância versus_fc89e34b2b_babdc262eb status:', state.data);

  const state2 = await axios.get('http://localhost:8080/instance/connectionState/versus_dfd8dbc7b0_e237492e8c', {
    headers: { apikey: 'verto123' }
  });
  console.log('Instância versus_dfd8dbc7b0_e237492e8c status:', state2.data);
}

testSend().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/test_send_2fa_check.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/test_send_2fa_check.js', (err, stream) => {
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

