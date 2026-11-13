const { Client } = require('ssh2');
const os = require('os');
const path = require('path');
const fs = require('fs');

function getSshConfig() {
  const keyPath = path.join(os.homedir(), '.ssh', 'id_ed25519');
  const config = {
    host: '187.127.10.166',
    port: 22,
    username: 'root',
    readyTimeout: 60000,
    keepaliveInterval: 10000,
  };

  if (fs.existsSync(keyPath)) {
    console.log(`Utilizando autenticação segura por Chave Privada SSH: ${keyPath}`);
    config.privateKey = fs.readFileSync(keyPath, 'utf8');
  } else if (process.env.VPS_PRIVATE_KEY) {
    console.log('Utilizando chave privada da variável de ambiente VPS_PRIVATE_KEY');
    config.privateKey = process.env.VPS_PRIVATE_KEY;
  } else if (process.env.VPS_PASSWORD) {
    console.log('Utilizando senha da variável de ambiente VPS_PASSWORD');
    config.password = process.env.VPS_PASSWORD;
  } else {
    console.log('Chave privada não encontrada em ~/.ssh/id_ed25519. Usando fallback de senha.');
    config.password = 'g@nY;+OWkSdi5.3D';
  }

  return config;
}

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
  }).connect(getSshConfig());
}

runDeploy();
