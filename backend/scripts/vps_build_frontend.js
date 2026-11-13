const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Executando build do frontend na VPS...');
  const script = `
    cd /root/verus/frontend &&
    echo "=== INICIANDO BUILD (npm run build) ===" &&
    npm run build
  `;
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => {
      process.stdout.write(d.toString());
      out += d;
    });
    stream.stderr.on('data', d => {
      process.stderr.write(d.toString());
      out += d;
    });
    stream.on('close', code => {
      console.log('\nFinalizado com código:', code);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

