const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('find /root -name "*.sql" -o -name "*.dump" -o -name "*backup*" 2>/dev/null', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('BACKUP FILES ON VPS:\n' + out);
      conn.end();
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

