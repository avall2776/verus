const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Iniciando deploy na VPS...');
  
  const deployCommand = [
    'cd /root/verus',
    'git stash', // Salva com segurança qualquer arquivo temporário da outra IDE
    'git pull origin main',
    'cd /root/verus/backend',
    'npx prisma generate',
    'npm run build',
    'pm2 restart versus-engine',
    'pm2 status',
  ].join(' && ');

  conn.exec(deployCommand, (err, stream) => {
    if (err) {
      console.error('Erro na execução remota:', err);
      conn.end();
      return;
    }

    let out = '';
    stream.on('data', d => {
      process.stdout.write(d);
      out += d;
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d);
      out += d;
    });
    stream.on('close', (code) => {
      console.log(`\nDeploy finalizado com código: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'),
});

