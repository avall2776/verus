const { Client } = require('ssh2');

const remoteScript = `
const axios = require('/root/verus/backend/node_modules/axios');
async function run() {
  const evolutionUrl = 'http://localhost:8080';
  const evolutionGlobalKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb'; // Verto Linha Principal

  console.log('Reiniciando socket da instancia...');
  try {
    const res = await axios.post(evolutionUrl + '/instance/restart/' + instance, {}, {
      headers: { apikey: evolutionGlobalKey }
    });
    console.log('Restart:', res.status, res.data);
  } catch (e) {
    console.log('Restart err:', e.message, e.response?.data);
  }
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/restart_inst.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/restart_inst.js', (err, stream) => {
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

