const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const targets = ['Rodrigo Trojan', 'Kasama', 'Eder Gurski', 'Edson Valcanaia', 'Eduardo Stephan'];
  let allCards = [];
  let offset = 0;
  while (true) {
    const res = await fetch(LERO_API + '/functions/v1/api-funnels-handler/v1/funnels/cards?limit=100&offset=' + offset, {
      headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
    });
    const json = await res.json();
    const data = json.data || [];
    allCards.push(...data);
    if (data.length < 100 || allCards.length >= (json.meta?.total || 1164)) break;
    offset += 100;
  }
  console.log('Total cards fetched:', allCards.length);

  for (const t of targets) {
    const matches = allCards.filter(c => c.title?.toLowerCase().includes(t.toLowerCase()) || c.description?.toLowerCase().includes(t.toLowerCase()));
    console.log('Target:', t, '-> found', matches.length, 'cards:');
    matches.forEach(m => {
      console.log('  title:', m.title, 'phone:', m.phone, 'assigned:', m.assigned_user_name, 'email:', m.assigned_user_email, 'stage:', m.stage_name, 'last_interaction:', m.last_interaction_at, 'updated_at:', m.updated_at);
    });
  }
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_targets.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_targets.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_targets.js', () => conn.end());
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

