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

console.log('=== 1. CHECK IF LID APPEARS IN INSTANCE FILES ===');
console.log(sh('docker exec evolution-api grep -rn "73444762877959" /evolution/instances/versus_fc89e34b2b_babdc262eb/ 2>/dev/null'));

console.log('=== 2. CHECK IF PHONE 992258423 APPEARS IN INSTANCE FILES ===');
console.log(sh('docker exec evolution-api grep -rn "992258423" /evolution/instances/versus_fc89e34b2b_babdc262eb/ 2>/dev/null'));

console.log('=== 3. CHECK STORE DIRECTORY FOR LID OR PHONE ===');
console.log(sh('docker exec evolution-api grep -rn "73444762877959" /evolution/store/ 2>/dev/null'));
console.log(sh('docker exec evolution-api grep -rn "992258423" /evolution/store/ 2>/dev/null'));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_lid_store.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_lid_store.js', (err, stream) => {
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

