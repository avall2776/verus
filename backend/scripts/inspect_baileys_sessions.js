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

console.log('=== 1. WHATSAPP.BAILEYS.SERVICE.JS LINES 880 TO 1030 ===');
console.log(sh('docker exec evolution-api sed -n "880,1030p" /evolution/dist/src/api/services/channels/whatsapp.baileys.service.js'));

console.log('=== 2. INSPECT SESSION FILES ===');
console.log('--- session-555491109159.0.json (Felipe Phone) ---');
console.log(sh('docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/session-555491109159.0.json'));
console.log('\\n--- session-555491109159.6.json ---');
console.log(sh('docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/session-555491109159.6.json'));
console.log('\\n--- session-555491109159.8.json ---');
console.log(sh('docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/session-555491109159.8.json'));
console.log('\\n--- session-555491109159.12.json ---');
console.log(sh('docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/session-555491109159.12.json'));
console.log('\\n--- session-555499112550.0.json (Verto Phone) ---');
console.log(sh('docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/session-555499112550.0.json'));
console.log('\\n--- session-555499112550.42.json (Verto Web 42) ---');
console.log(sh('docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/session-555499112550.42.json'));
console.log('\\n--- session-555499112550.44.json (Verto Web 44) ---');
console.log(sh('docker exec evolution-api cat /evolution/instances/versus_fc89e34b2b_babdc262eb/session-555499112550.44.json'));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/inspect_baileys_sessions.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/inspect_baileys_sessions.js', (err, stream) => {
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

