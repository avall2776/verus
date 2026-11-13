const { Client } = require('ssh2');

const remoteScript = `
const axios = require('/root/verus/backend/node_modules/axios');
async function run() {
  const evolutionUrl = 'http://localhost:8080';
  const evolutionGlobalKey = 'verto123';

  const res = await axios.get(evolutionUrl + '/instance/fetchInstances', {
    headers: { apikey: evolutionGlobalKey }
  });
  console.log(JSON.stringify(res.data.map(i => ({
    name: i.instance?.instanceName,
    owner: i.instance?.owner,
    profileName: i.instance?.profileName,
    status: i.instance?.status
  })), null, 2));
}
run().catch(console.error);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/fetch_inst.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/fetch_inst.js', (err, stream) => {
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

