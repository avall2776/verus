const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Verificando estado do servidor VPS...');
  const script = `
    echo "=== HOST & OS ==="
    hostnamectl || uname -a
    echo "=== NODE & NPM ==="
    node -v
    npm -v
    echo "=== PM2 STATUS ==="
    pm2 status
    echo "=== MEMORY & DISK ==="
    free -h
    df -h /
    echo "=== NGINX CHECK ==="
    which nginx || echo "Nginx not installed"
    systemctl is-active nginx 2>/dev/null || echo "Nginx inactive"
    echo "=== PORTS IN USE ==="
    netstat -tulpn | grep -E "80|443|3000|3001|8080|5432" || ss -tulpn | grep -E "80|443|3000|3001|8080|5432"
    echo "=== /root/verus DIRECTORY ==="
    ls -la /root/verus
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', code => {
      console.log(out);
      console.log('Exit code:', code);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

