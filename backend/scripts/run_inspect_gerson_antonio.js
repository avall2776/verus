const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localScriptPath = path.join(__dirname, 'inspect_gerson_antonio.js');
const scriptContent = fs.readFileSync(localScriptPath, 'utf8');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_gerson_antonio.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_gerson_antonio.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
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

