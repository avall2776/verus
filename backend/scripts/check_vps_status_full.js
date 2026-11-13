const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Verificando repositório na VPS...');
  conn.exec('cd /root/verus && git status && echo "--- RECENT COMMITS ---" && git log -3 --oneline && echo "--- PM2 STATUS ---" && pm2 status', (err, stream) => {
    if (err) {
      console.error('Erro ao executar comando:', err);
      conn.end();
      return;
    }
    let output = '';
    stream.on('data', d => output += d);
    stream.stderr.on('data', d => output += d);
    stream.on('close', (code) => {
      console.log(output);
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('Erro de conexão SSH:', err.message);
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

