const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
echo "=== DOCKER INSPECT EVOLUTION-API ==="
docker inspect evolution-api --format 'RestartCount: {{.RestartCount}}, OOMKilled: {{.State.OOMKilled}}, ExitCode: {{.State.ExitCode}}, StartedAt: {{.State.StartedAt}}, FinishedAt: {{.State.FinishedAt}}, Error: {{.State.Error}}'

echo "=== MEMORY STATS ==="
free -h

echo "=== DMESG OOM CHECK ==="
dmesg -T | grep -i -E "oom|killed|evolution" | tail -n 20

echo "=== EVOLUTION API RECENT DOCKER LOGS BEFORE RESTART ==="
docker logs --tail 40 evolution-api
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

