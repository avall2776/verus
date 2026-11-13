const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const res = await fetch(LERO_API + '/functions/v1/api-funnels-handler/v1/funnels/cards?stage_id=509affc6-5441-408e-8a46-e384c4369b34&limit=10', {
    headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
  });
  const json = await res.json();
  console.log('Novo Contato cards:', json.data?.map(c => ({
    title: c.title,
    phone: c.phone,
    position: c.position,
    deal_number: c.deal_number,
    deal_code: c.deal_code,
    assigned: c.assigned_user_name,
    updated_at: c.updated_at
  })));
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_novo_contato.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_novo_contato.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_novo_contato.js', () => conn.end());
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

