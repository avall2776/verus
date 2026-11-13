const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('ps aux | grep -E "node|nginx|caddy|pm2" | grep -v grep; docker ps', (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

