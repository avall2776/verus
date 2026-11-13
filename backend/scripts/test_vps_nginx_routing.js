const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Testando roteamento completo no Nginx...');
  const script = `
    echo "=== 1. TESTE FRONTEND ==="
    curl -s -o /dev/null -w "Status: %{http_code}\\\\n" http://127.0.0.1/vallor/login

    echo "=== 2. TESTE BACKEND VIA NGINX (/api-backend/) ==="
    curl -s -o /dev/null -w "Status: %{http_code}\\\\n" http://127.0.0.1/api-backend/deals/stages

    echo "=== 3. TESTE WEBSOCKET / SOCKET.IO VIA NGINX ==="
    curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: 127.0.0.1" -H "Origin: http://127.0.0.1" "http://127.0.0.1/socket.io/?EIO=4&transport=websocket" --max-time 3 || true
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

