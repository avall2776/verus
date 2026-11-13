const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const targets = ['Rodrigo Trojan', 'Kasama', 'Rosicleia', 'Caio', 'Eder Gurski'];
  for (const t of targets) {
    const res = await fetch(LERO_API + '/functions/v1/api-contacts-handler/v1/contacts?search=' + encodeURIComponent(t), {
      headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
    });
    const json = await res.json();
    console.log(t, 'matches:', json.data?.length, json.data?.map(c => ({
      name: c.name,
      phone: c.phone,
      jid: c.jid,
      last_interaction_at: c.last_interaction_at,
      updated_at: c.updated_at
    })));
  }
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_contacts_search.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_contacts_search.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_contacts_search.js', () => conn.end());
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

