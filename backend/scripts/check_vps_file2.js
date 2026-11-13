const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec('sed -n "880,950p" /root/verus/backend/src/modules/dashboard/dashboard.service.ts', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', data => console.log('VPS lines:\n', data.toString()));
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

