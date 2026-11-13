const { Client } = require('ssh2');

const remoteScript = `
const { execSync } = require('child_process');
function sh(cmd) {
  try { return execSync(cmd).toString(); } catch (e) { return e.message; }
}

console.log('=== 1. BUSCANDO CHATS OU JIDS @g.us NO DIRETORIO DA INSTANCIA ===');
console.log(sh('docker exec evolution-api ls -la /evolution/instances/versus_fc89e34b2b_babdc262eb/ | grep -i "@g.us" | head -n 30'));

console.log('\\n=== 2. BUSCANDO ARQUIVOS DE CHATS OU GRUPOS NO STORE ===');
console.log(sh('docker exec evolution-api ls -la /evolution/store/chats/versus_fc89e34b2b_babdc262eb/ 2>/dev/null | grep -i "@g.us" | head -n 30'));

console.log('\\n=== 3. BUSCANDO SENDER-KEYS COM @g.us ===');
console.log(sh('docker exec evolution-api ls -la /evolution/instances/versus_fc89e34b2b_babdc262eb/ | grep -i "sender-key-group" | head -n 30'));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/find_group_jids.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/find_group_jids.js', (err, stream) => {
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

