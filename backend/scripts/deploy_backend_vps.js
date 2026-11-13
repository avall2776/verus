const { Client } = require('ssh2');
const os = require('os');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(os.homedir(), '.ssh', 'id_ed25519');
const sshConfig = {
  host: '187.127.10.166',
  port: 22,
  username: 'root',
};
if (fs.existsSync(keyPath)) {
  sshConfig.privateKey = fs.readFileSync(keyPath, 'utf8');
} else if (process.env.VPS_PRIVATE_KEY) {
  sshConfig.privateKey = process.env.VPS_PRIVATE_KEY;
} else {
  sshConfig.password = process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D';
}

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
cd /root/verus/backend
git pull origin main
npm run build
pm2 reload versus-engine
pm2 status
`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect(sshConfig);

