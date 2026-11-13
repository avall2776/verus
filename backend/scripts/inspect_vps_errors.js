const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    echo "=== DOCKER PS ==="
    docker ps
    echo "=== EVOLUTION LOGS LAST 40 ==="
    docker logs --tail 40 evolution-api
    echo "=== NGINX STATUS ==="
    systemctl status nginx || true
    echo "=== PORTS LISTENING ==="
    netstat -tulpn | grep -E "3001|8080|80|443"
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d))
      .stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', console.error).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
