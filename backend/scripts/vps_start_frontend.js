const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Iniciando versus-frontend no PM2...');
  const script = `
    cd /root/verus/frontend
    pm2 delete versus-frontend 2>/dev/null || true
    pm2 start npm --name "versus-frontend" -- run start -- -p 3000
    pm2 save
    sleep 4
    echo "=== VERIFICANDO PM2 STATUS ==="
    pm2 status
    echo "=== TESTANDO CONEXÃO LOCAL PORTA 3000 ==="
    curl -I http://127.0.0.1:3000/vallor/login
    echo "=== TESTANDO VIA NGINX PORTA 80 ==="
    curl -I http://127.0.0.1/vallor/login
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => {
      process.stdout.write(d.toString());
      out += d;
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d.toString());
      out += d;
    });
    stream.on('close', code => {
      console.log('\nFinalizado com código:', code);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

