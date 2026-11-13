const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('ps aux | grep -E "nginx|caddy|apache|traefik|docker" | grep -v grep', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => out += d);
    stream.on('close', () => {
      console.log('Web servers:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

