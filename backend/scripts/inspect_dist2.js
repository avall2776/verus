const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const fs = require('fs');
const file = fs.readFileSync('/root/verus/backend/dist/src/modules/queues/processors/webhook.processor.js', 'utf8');
const idx = file.indexOf('addPhoneVariants(realPhone);');
console.log(file.substring(idx, idx + 800));
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_dist2.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_dist2.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
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

