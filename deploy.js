const { Client } = require('ssh2');

const conn = new Client();

console.log('Iniciando deploy no VPS...');

conn.on('ready', () => {
  console.log('Conexão SSH estabelecida. Executando comandos...');
  conn.exec(`
    cd /root/verus && 
    git fetch origin &&
    git reset --hard origin/main && 
    cd /root/verus/backend && 
    npm install --legacy-peer-deps && 
    npx prisma db push &&
    npx prisma generate &&
    npm run build && 
    pm2 restart all --update-env &&
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
