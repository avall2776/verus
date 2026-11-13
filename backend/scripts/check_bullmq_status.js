const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  const script = `
    echo "=== REDIS BULLMQ STATUS ==="
    redis-cli keys "bull:webhook-ingress:*" | grep -E "waiting|active|completed|failed" || true
    echo "=== COMPLETED JOBS COUNT ==="
    redis-cli zcard "bull:webhook-ingress:completed" || true
    echo "=== WAITING JOBS COUNT ==="
    redis-cli llen "bull:webhook-ingress:wait" || true
    echo "=== FAILED JOBS COUNT ==="
    redis-cli zcard "bull:webhook-ingress:failed" || true
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', code => {
      console.log(out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

