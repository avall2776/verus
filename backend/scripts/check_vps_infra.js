const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== NGINX CONFIGS ==="
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No sites-enabled"
    cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/* 2>/dev/null || echo "No nginx configs"
    echo "=== DOCKER CONTAINERS ==="
    docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

