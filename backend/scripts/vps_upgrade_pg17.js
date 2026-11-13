const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Adicionando repositório oficial do PostgreSQL 17 na VPS...');

  const commands = [
    'install -d /etc/apt/keyrings',
    'curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg',
    'echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt noble-pgdg main" > /etc/apt/sources.list.d/pgdg.list',
    'apt-get update -y',
    'DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-17 postgresql-client-17 postgresql-contrib-17',
    'systemctl enable postgresql',
    'systemctl restart postgresql',
    'pg_dump --version',
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;

    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log(`\nAtualização para PostgreSQL 17 finalizada com código: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

