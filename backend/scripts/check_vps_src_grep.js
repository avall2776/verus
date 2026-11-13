const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  conn.exec('grep -n "ecosystem" /root/verus/backend/src/modules/dashboard/dashboard.service.ts', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
    stream.on('data', data => console.log('VPS src grep:', data.toString()));
    stream.stderr.on('data', data => console.error('VPS stderr:', data.toString()));
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

