const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const conn = new Client();

const deployScript = `
cd /root/verus && git pull origin main
cd /root/verus/backend && npm run build
pm2 restart versus-engine
sleep 3
pm2 status versus-engine
`;

conn.on('ready', () => {
  console.log('Connecting to VPS for deployment...');
  conn.exec(deployScript, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => {
      process.stdout.write(d.toString());
      out += d.toString();
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d.toString());
    });
    stream.on('close', (code) => {
      console.log('Deploy script finished with code:', code);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'),
});

