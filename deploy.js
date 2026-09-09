const { Client } = require('ssh2');

const conn = new Client();

console.log('Iniciando deploy no VPS...');

conn.on('ready', () => {
  console.log('Conexão SSH estabelecida. Executando comandos...');
  conn.exec(`
    cd /root/verus/backend && 
    git reset --hard &&
    git pull && 
    npm install --legacy-peer-deps && 
    npm run build && 
    pm2 restart versus-engine &&
    echo "Deploy Backend finalizado!"
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Deploy concluído com código ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
