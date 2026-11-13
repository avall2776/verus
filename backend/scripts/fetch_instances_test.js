const { Client } = require('ssh2');

const scriptCode = `
const axios = require('/root/verus/backend/node_modules/axios');

async function run() {
  const res = await axios.get('http://localhost:8080/instance/fetchInstances', {
    headers: { apikey: 'verto123' }
  });
  console.log('Instâncias Evolution raw:', JSON.stringify(res.data, null, 2));
}

run().catch(e => console.error(e.message, e.response?.data));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/check_fetch_instances.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/check_fetch_instances.js', (err, stream) => {
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
