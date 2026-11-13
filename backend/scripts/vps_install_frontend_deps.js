const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH conectado. Instalando dependências e configurando .env.production no frontend...');
  const script = `
    cat << 'EOF' > /root/verus/frontend/.env.production
NEXT_PUBLIC_SENTRY_DSN="https://e5193fe33968a56c4fa53feb72a53cbf@o4512056894488576.ingest.us.sentry.io/4512056930271232"
NEXT_PUBLIC_APP_URL="https://avalmarketing.com.br/vallor"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="579117409411-v4vpvnfcfq24b49u5t3e2d3fsad000vv.apps.googleusercontent.com"
BACKEND_URL="http://127.0.0.1:3001"
PORT=3000
NODE_ENV=production
EOF

    cd /root/verus/frontend &&
    echo "=== INSTALANDO DEPENDENCIAS (npm install --production=false) ===" &&
    npm install --legacy-peer-deps &&
    echo "=== DEPENDENCIAS INSTALADAS COM SUCESSO ==="
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

