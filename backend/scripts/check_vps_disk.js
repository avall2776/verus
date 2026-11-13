const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('df -h / && ls -lh /root/backups && ls -lh /root/supabase*.sql 2>/dev/null || true', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

