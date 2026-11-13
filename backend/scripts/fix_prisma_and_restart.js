const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `cd /root/verus/backend && npx prisma generate && npm run build && pm2 restart versus-engine`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => out += d);
    stream.stderr.on('data', (d) => out += d);
    stream.on('close', (code) => {
      console.log('Exit code:', code);
      console.log('Output:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

