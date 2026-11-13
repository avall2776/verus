const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Iniciando git checkout, git pull e build do frontend na VPS...');

  const cmd = 'cd /root/verus && git checkout -- . && git pull origin main && npm --prefix frontend run build && pm2 restart versus-engine && pm2 status';
  console.log(`Executando: ${cmd}`);

  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error('Erro na execucao SSH:', err);
      conn.end();
      return;
    }

    stream.on('data', (d) => process.stdout.write(d.toString()));
    stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log(`\nDeploy finalizado com codigo de saida: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'),
});
