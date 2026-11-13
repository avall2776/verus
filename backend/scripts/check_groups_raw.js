const { Client } = require('ssh2');

const remoteScript = `
const axios = require('/root/verus/backend/node_modules/axios');

async function run() {
  const evolutionUrl = 'http://localhost:8080';
  const evolutionGlobalKey = 'verto123';
  const instance = 'versus_fc89e34b2b_babdc262eb';

  try {
    const res = await axios.get(evolutionUrl + '/group/fetchAllGroups/' + instance + '?getParticipants=false', {
      headers: { apikey: evolutionGlobalKey }
    });
    console.log('Tipo:', typeof res.data, Array.isArray(res.data) ? 'Array' : Object.keys(res.data));
    console.log(JSON.stringify(res.data).substring(0, 500));
  } catch (err) {
    console.log('Erro:', err.message, err.response?.data);
  }
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_groups_raw.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_groups_raw.js', (err, stream) => {
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

