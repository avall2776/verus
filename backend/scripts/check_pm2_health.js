const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec("pm2 status versus-engine && pm2 logs versus-engine --lines 20 --nostream", (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('PM2 check:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });
