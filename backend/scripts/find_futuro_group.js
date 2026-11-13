const { Client } = require('ssh2');

const remoteScript = `
const { execSync } = require('child_process');
function sh(cmd) {
  try { return execSync(cmd).toString(); } catch (e) { return e.message; }
}

console.log('=== BUSCANDO ARQUIVOS COM "Futuro" NO STORE DO EVOLUTION ===');
console.log(sh('docker exec evolution-api grep -rn -i "futuro" /evolution/store/ 2>/dev/null | head -n 30'));

console.log('\\n=== BUSCANDO ARQUIVOS DE CHATS OU MENSAGENS COM "Futuro" ===');
console.log(sh('docker exec evolution-api grep -rn -i "Futuro Máquinas" /evolution/ 2>/dev/null | head -n 30'));
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/find_futuro_group.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/find_futuro_group.js', (err, stream) => {
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

