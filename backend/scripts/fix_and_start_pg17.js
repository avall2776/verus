const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Corrigindo postgresql.conf...');

  const commands = [
    // Remove as linhas duplicadas ou com aspas incorretas
    "sed -i \"/listen_addresses/d\" /etc/postgresql/17/main/postgresql.conf",
    "echo \"listen_addresses = '127.0.0.1'\" >> /etc/postgresql/17/main/postgresql.conf",
    // Inicia o cluster 17
    'pg_ctlcluster 17 main start',
    'pg_lsclusters',
    // Recupera a senha do versus_user e configura o banco
    'source /root/.versus_db_credentials',
    `sudo -u postgres psql -p 5432 -c "DO \\$\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'versus_user') THEN CREATE ROLE versus_user WITH LOGIN PASSWORD '$LOCAL_DB_PASS' CREATEDB; END IF; END \\$\\$;"`,
    `sudo -u postgres psql -p 5432 -c "ALTER ROLE versus_user WITH PASSWORD '$LOCAL_DB_PASS';"`,
    `sudo -u postgres psql -p 5432 -c "SELECT 1 FROM pg_database WHERE datname = 'versus_db';" | grep -q 1 || sudo -u postgres psql -p 5432 -c "CREATE DATABASE versus_db OWNER versus_user;"`,
    `sudo -u postgres psql -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE versus_db TO versus_user;"`,
    `sudo -u postgres psql -p 5432 -d versus_db -c "CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\";"`,
    `sudo -u postgres psql -p 5432 -d versus_db -c "CREATE EXTENSION IF NOT EXISTS \\"pgcrypto\\";"`,
    // Testa conexão
    `PGPASSWORD="$LOCAL_DB_PASS" psql -h 127.0.0.1 -p 5432 -U versus_user -d versus_db -c "SELECT 'PostgreSQL 17 ONLINE: ' || version();"`,
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      console.log(`\nConfiguração concluída com código: ${code}`);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D' });

