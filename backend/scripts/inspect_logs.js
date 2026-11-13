const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const fs = require('fs');
const log = fs.readFileSync('/root/.pm2/logs/versus-engine-out.log', 'utf8');
const lines = log.split('\\n').filter(l => l.includes('13:28:4') || l.includes('13:28:5') || l.includes('13:28:3') || l.includes('7c32daa8'));
console.log(lines.slice(0, 30).join('\\n'));
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_logs.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_logs.js', (err, stream) => {
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

