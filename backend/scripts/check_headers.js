const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('curl -I http://127.0.0.1:3000/conversations', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => out += d);
    stream.on('close', () => {
      console.log('HTTP Headers:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

