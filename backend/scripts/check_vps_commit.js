const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Ready');
  conn.exec('cd /root/verus && git log -1 --oneline', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', data => console.log('VPS Git Commit:', data.toString()));
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

