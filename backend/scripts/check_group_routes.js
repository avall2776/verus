const { Client } = require('ssh2');

const remoteScript = `
const { execSync } = require('child_process');
function sh(cmd) {
  try { return execSync(cmd).toString(); } catch (e) { return e.message; }
}
console.log(sh('docker exec evolution-api grep -n -A 20 "fetchAllGroups" /evolution/dist/src/api/controllers/group.controller.js 2>/dev/null'));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_group_routes.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_group_routes.js', (err, stream) => {
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

