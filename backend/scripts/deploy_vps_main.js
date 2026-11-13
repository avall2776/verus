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

const scriptCode = `
const { execSync } = require('child_process');

console.log('1. Puxando git no VPS...');
const pull = execSync('cd /root/verus && git fetch origin main && git reset --hard origin/main', { encoding: 'utf8' });
console.log(pull);

console.log('2. Compilando backend no VPS...');
const build = execSync('cd /root/verus/backend && npm run build', { encoding: 'utf8' });
console.log(build);

console.log('3. Reiniciando versus-engine no PM2...');
const restart = execSync('pm2 restart versus-engine', { encoding: 'utf8' });
console.log(restart);
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/deploy_backend.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/deploy_backend.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).connect(sshConfig);
