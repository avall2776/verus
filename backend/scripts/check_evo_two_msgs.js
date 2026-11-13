const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection ready. Checking Evolution API container logs...');
  
  // 1. Procurar nas mensagens do PM2 por 81101375 e 84841099
  const cmd = `
echo "=== PM2 LOGS FOR 81101375 ==="
grep -E "81101375|84841099" /root/.pm2/logs/versus-engine-out.log /root/.pm2/logs/versus-engine-error.log | tail -n 30

echo "=== EVOLUTION DOCKER LOGS FOR 81101375 ==="
docker ps
docker logs $(docker ps -q -f name=evolution) --tail 1000 | grep -E "81101375|84841099|Oi bom dia|Bom dia Blz" | tail -n 30
`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log('\nLog check exit code ' + code);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

