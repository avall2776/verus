const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `cd /root/verus && git pull origin main && cd /root/verus/backend && npm run build && pm2 restart versus-engine`;
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
}).connect({ host: '187.127.10.166', port: 22, username: 'root', privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'), });

