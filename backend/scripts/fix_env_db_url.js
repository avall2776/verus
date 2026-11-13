const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Gravando DATABASE_URL correta no .env...');

  const script = `
  const fs = require('fs');
  const creds = fs.readFileSync('/root/.versus_db_credentials', 'utf8');
  const pass = creds.match(/LOCAL_DB_PASS="([^"]+)"/)[1];
  const url = "postgresql://versus_user:" + encodeURIComponent(pass) + "@127.0.0.1:5432/versus_db?connection_limit=40";

  let env = fs.readFileSync('/root/verus/backend/.env', 'utf8');
  env = env.replace(/DATABASE_URL=.*/, 'DATABASE_URL="' + url + '"');
  fs.writeFileSync('/root/verus/backend/.env', env);

  console.log('DATABASE_URL gravada com sucesso!');
  `;

  conn.exec(`node -e "${script.replace(/"/g, '\\"')}" && grep DATABASE_URL /root/verus/backend/.env && pm2 restart versus-engine --update-env && sleep 2 && pm2 status`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      console.log(`Configuração finalizada com código: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

