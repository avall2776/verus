const { Client } = require('ssh2');

const remoteScript = `
const { execSync } = require('child_process');

function sh(cmd) {
  try {
    return execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
  } catch (e) {
    return 'ERR: ' + e.message + '\\n' + (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : '');
  }
}

console.log('=== 1. DOCKER IMAGES ON VPS ===');
console.log(sh('docker images'));

console.log('=== 2. DOCKER VOLUMES ON VPS ===');
console.log(sh('docker volume ls'));

console.log('=== 3. EVOLUTION LOGS AROUND 16:05 TO 16:12 (WHEN USER TESTED) ===');
console.log(sh('docker logs evolution-api --tail 200 2>&1'));

console.log('=== 4. WHATSAPP.BAILEYS.SERVICE.JS AROUND connectToWhatsapp / makeWASocket / msgRetryCounterCache ===');
console.log(sh('docker exec evolution-api grep -n -C 35 "makeWASocket" /evolution/dist/src/api/services/channels/whatsapp.baileys.service.js'));

console.log('=== 5. SESSION FILES FOR FELIPE (555491109159) AND VERTO (555499112550) IN INSTANCE DIR ===');
console.log(sh('docker exec evolution-api ls -la /evolution/instances/versus_fc89e34b2b_babdc262eb/ | grep -E "555491109159|555499112550|creds"'));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/audit_vps_today.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/audit_vps_today.js', (err, stream) => {
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

