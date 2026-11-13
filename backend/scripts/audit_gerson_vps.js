const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `grep -E "11/13/2026, 1:28:" /root/.pm2/logs/versus-engine-out.log | head -n 30`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D' });
