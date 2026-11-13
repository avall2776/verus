const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec("docker exec versus-postgres psql -U postgres -d versus_db -t -c \"SELECT count(*) FROM deals WHERE metadata->>'position' IS NOT NULL;\"", (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

