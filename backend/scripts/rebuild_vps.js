const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH Ready, cleaning dist and rebuilding backend on VPS...');
  conn.exec('cd /root/verus/backend && rm -rf dist && npm run build && pm2 restart versus-engine', (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('Finished with code:', code);
      conn.end();
    });
    stream.on('data', data => process.stdout.write(data.toString()));
    stream.stderr.on('data', data => process.stderr.write(data.toString()));
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

