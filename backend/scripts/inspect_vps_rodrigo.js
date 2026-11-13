const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Atualizando backend na VPS...');
  const cmd = 'cd /root/verus && git pull origin main && npm --prefix backend run build && pm2 reload versus-engine';
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log(`Backend atualizado com codigo: ${code}`);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D' });
