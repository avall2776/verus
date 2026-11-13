const { Client } = require('ssh2');
const crypto = require('crypto');

// Gera uma senha segura para o banco local
const dbPassword = crypto.randomBytes(16).toString('hex') + '!V4ll0r';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Iniciando instalação do PostgreSQL 16 na VPS...');

  const commands = [
    'apt-get update -y',
    'DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib',
    'systemctl enable postgresql',
    'systemctl restart postgresql',
    // Cria usuário e banco de dados
    `sudo -u postgres psql -c "DO \\$\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'versus_user') THEN CREATE ROLE versus_user WITH LOGIN PASSWORD '${dbPassword}' CREATEDB; END IF; END \\$\\$;"`,
    `sudo -u postgres psql -c "ALTER ROLE versus_user WITH PASSWORD '${dbPassword}';"`,
    `sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'versus_db';" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE versus_db OWNER versus_user;"`,
    `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE versus_db TO versus_user;"`,
    // Garante que escuta apenas em 127.0.0.1 (segurança total contra ataques externos)
    "sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = '127.0.0.1'/g\" /etc/postgresql/*/main/postgresql.conf",
    // Configura tuning de performance para 8GB RAM
    "sed -i \"s/shared_buffers = .*/shared_buffers = 1GB/g\" /etc/postgresql/*/main/postgresql.conf",
    "sed -i \"s/#effective_cache_size = .*/effective_cache_size = 3GB/g\" /etc/postgresql/*/main/postgresql.conf",
    "sed -i \"s/#work_mem = .*/work_mem = 32MB/g\" /etc/postgresql/*/main/postgresql.conf",
    "sed -i \"s/#maintenance_work_mem = .*/maintenance_work_mem = 256MB/g\" /etc/postgresql/*/main/postgresql.conf",
    'systemctl restart postgresql',
    // Testa a conexão local
    `PGPASSWORD='${dbPassword}' psql -h 127.0.0.1 -U versus_user -d versus_db -c "SELECT 'Conexao PostgreSQL OK: ' || version();"`,
    // Salva as credenciais em arquivo seguro na VPS
    `echo 'LOCAL_DB_PASS="${dbPassword}"' > /root/.versus_db_credentials`,
    `chmod 600 /root/.versus_db_credentials`,
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Erro na execução:', err);
      conn.end();
      return;
    }

    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log(`\nInstalação e configuração finalizadas com código: ${code}`);
      console.log(`Credenciais salvas: versus_user / ${dbPassword}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

