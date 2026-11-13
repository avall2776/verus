const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
pm2 status
echo "=== PM2 RECENT LOGS ==="
pm2 logs versus-engine --lines 60 --nostream
echo "=== DOCKER CONTAINERS ==="
docker ps
`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
