const { Client } = require('ssh2');

const remoteScript = `
const { execSync } = require('child_process');

function sh(cmd) {
  try {
    return execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
  } catch (e) {
    return 'ERR: ' + e.message;
  }
}

console.log('=== 1. EVOLUTION DOCKER LOGS FOR ACBE32BD2839932B8C2C63F6391BA82C ===');
console.log(sh('docker logs evolution-api 2>&1 | grep -C 10 "ACBE32BD2839932B8C2C63F6391BA82C"'));

console.log('\\n=== 2. PM2 LOGS FOR ACBE32BD2839932B8C2C63F6391BA82C ===');
console.log(sh('grep -C 10 "ACBE32BD2839932B8C2C63F6391BA82C" /root/.pm2/logs/versus-engine-out.log'));

console.log('\\n=== 3. PM2 LOGS AROUND 17:54:52 (14:54:52) ===');
console.log(sh('grep -C 15 "73444762877959" /root/.pm2/logs/versus-engine-out.log'));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/audit_webhook_payload.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/audit_webhook_payload.js', (err, stream) => {
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
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

