const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connection ready. Querying Evolution API directly via curl...');
  
  const cmd = `
echo "=== 1. WEBHOOK CONFIG ==="
curl -s -H "apikey: verto123" http://127.0.0.1:8080/webhook/find/versus_fc89e34b2b_babdc262eb

echo "\n=== 2. CONNECTION STATE ==="
curl -s -H "apikey: verto123" http://127.0.0.1:8080/instance/connectionState/versus_fc89e34b2b_babdc262eb

echo "\n=== 3. MESSAGES IN EVOLUTION FOR 5592981101375 ==="
curl -s -X POST -H "apikey: verto123" -H "Content-Type: application/json" -d '{"where":{"key":{"remoteJid":"5592981101375@s.whatsapp.net"}}}' http://127.0.0.1:8080/chat/findMessages/versus_fc89e34b2b_babdc262eb

echo "\n=== 4. MESSAGES IN EVOLUTION FOR 559281101375 ==="
curl -s -X POST -H "apikey: verto123" -H "Content-Type: application/json" -d '{"where":{"key":{"remoteJid":"559281101375@s.whatsapp.net"}}}' http://127.0.0.1:8080/chat/findMessages/versus_fc89e34b2b_babdc262eb

echo "\n=== 5. MESSAGES IN EVOLUTION FOR 5563984841099 ==="
curl -s -X POST -H "apikey: verto123" -H "Content-Type: application/json" -d '{"where":{"key":{"remoteJid":"5563984841099@s.whatsapp.net"}}}' http://127.0.0.1:8080/chat/findMessages/versus_fc89e34b2b_babdc262eb

echo "\n=== 6. MESSAGES IN EVOLUTION FOR 556384841099 ==="
curl -s -X POST -H "apikey: verto123" -H "Content-Type: application/json" -d '{"where":{"key":{"remoteJid":"556384841099@s.whatsapp.net"}}}' http://127.0.0.1:8080/chat/findMessages/versus_fc89e34b2b_babdc262eb
`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log('\nExit code ' + code);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});
