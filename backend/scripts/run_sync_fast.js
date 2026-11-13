const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localScriptPath = path.join(__dirname, 'sync_lero_fast.js');
const scriptContent = fs.readFileSync(localScriptPath, 'utf8');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/sync_lero_fast.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      console.log('Script fast uploaded. Executing...');
      conn.exec('cd /root/verus/backend && node scripts/sync_lero_fast.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
          console.log(`\nFast sync finished with code ${code}`);
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

