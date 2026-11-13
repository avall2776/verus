const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
echo "=== DOCKER RUN ARGS / ENV OF EVOLUTION-API ==="
docker inspect evolution-api --format '{{range .Config.Env}}{{println .}}{{end}}'

echo "=== VOLUMES ==="
docker inspect evolution-api --format '{{range .Mounts}}{{println .Source " -> " .Destination}}{{end}}'

echo "=== DOCKER COMPOSE FILE OR RUN SCRIPT ==="
ls -la /root/evolution* /root/docker* /home/*/evolution* 2>/dev/null
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
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

