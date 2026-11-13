const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  // Let's inspect today's PM2 logs, errors, and system activity
  const script = `
    echo "=== PM2 STATUS ==="
    pm2 status
    echo "=== TAIL ERROR LOGS ==="
    tail -n 80 /root/.pm2/logs/versus-engine-error.log
    echo "=== RECENT CRITICAL OUT LOGS ==="
    grep -E "ERROR|WARN|Fail|Exception|500|401|400" /root/.pm2/logs/versus-engine-out.log | tail -n 40
  `;
  conn.exec(script, (err, stream) => {
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

