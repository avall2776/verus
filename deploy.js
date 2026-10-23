const { Client } = require('ssh2');

function runDeploy() {
  const conn = new Client();
  console.log('Iniciando conexão SSH com o VPS (187.127.10.166)...');

  conn.on('ready', () => {
    console.log('Conexão SSH estabelecida com sucesso. Executando comandos de deploy...');
    conn.exec(`
      cd /root/verus && 
      git fetch origin && 
      git reset --hard origin/main && 
      cd /root/verus/backend && 
      npm install --legacy-peer-deps && 
      npx prisma generate && 
      npm run build && 
      pm2 restart versus-engine --max-memory-restart 1500M --update-env && 
      pm2 save && 
      echo "=== DEPLOY VERSUS ENGINE CONCLUIDO COM SUCESSO ==="
    `, (err, stream) => {
      if (err) {
        console.error('Erro na execução dos comandos:', err);
        conn.end();
        return;
      }
      stream.on('close', (code, signal) => {
        console.log('Deploy concluído com código ' + code);
        conn.end();
      }).on('data', (data) => {
        process.stdout.write(data.toString());
      }).stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
    });
  }).on('error', (err) => {
    console.error('Erro de conexão SSH:', err.message);
  }).connect({
    host: '187.127.10.166',
    port: 22,
    username: 'root',
    password: 'g@nY;+OWkSdi5.3D',
    readyTimeout: 60000,
    keepaliveInterval: 10000
  });
}

runDeploy();
