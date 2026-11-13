const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Atualizando código na VPS...');
  const script = `
    cd /root/verus &&
    git fetch origin &&
    git reset --hard origin/main &&
    echo "=== REPO ATUALIZADO NO COMMIT: ===" &&
    git log -1 --oneline &&
    echo "=== VERIFICANDO ARQUIVOS FRONTEND ===" &&
    ls -la /root/verus/frontend
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', code => {
      console.log(out);
      console.log('Finalizado com código:', code);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

