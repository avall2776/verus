const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('grep -i "2fa" /root/.pm2/logs/versus-engine-out.log /root/.pm2/logs/versus-engine-error.log | tail -n 20', (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- LOGS 2FA NA VPS ---');
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

