const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function check() {
  const url = LERO_API + '/functions/v1/api-funnels-handler/v1/funnels/cards?limit=5';
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
  });
  const json = await res.json();
  console.log('Cards count:', json.data?.length);
  if (json.data && json.data.length > 0) {
    console.log('Sample Card 0:', JSON.stringify(json.data[0], null, 2));
    console.log('Sample Card 1:', JSON.stringify(json.data[1], null, 2));
  }
}
check();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/inspect_card_fields.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node inspect_card_fields.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/verus/backend/inspect_card_fields.js', () => conn.end());
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

