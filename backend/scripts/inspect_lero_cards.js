const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const res = await fetch(LERO_API + '/functions/v1/api-funnels-handler/v1/funnels/cards?limit=5', {
    headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
  });
  const json = await res.json();
  console.log('Cards response keys:', Object.keys(json));
  if (json.data) {
    console.log('Total returned:', json.data.length);
    if (json.data[0]) {
      console.log('Sample card keys:', Object.keys(json.data[0]));
      console.log('Sample card:', JSON.stringify(json.data[0], null, 2));
    }
  }
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_cards.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_cards.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_cards.js', () => conn.end());
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

