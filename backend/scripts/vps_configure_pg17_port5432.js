const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Configurando PostgreSQL 17 na porta principal 5432...');

  const commands = [
    // 1. Remove cluster 16 para liberar a porta 5432
    'pg_dropcluster 16 main --stop || true',
    // 2. Muda cluster 17 para a porta 5432
    'pg_conftool 17 main set port 5432',
    // 3. Blindagem de segurança: listen_addresses = 127.0.0.1
    "pg_conftool 17 main set listen_addresses '127.0.0.1'",
    // 4. Performance tuning para 8GB RAM
    "pg_conftool 17 main set shared_buffers '1GB'",
    "pg_conftool 17 main set effective_cache_size '3GB'",
    "pg_conftool 17 main set work_mem '32MB'",
    "pg_conftool 17 main set maintenance_work_mem '256MB'",
    // 5. Reinicia cluster 17
    'systemctl restart postgresql',
    'pg_lsclusters',
    // 6. Recupera senha salva ou usa a existente
    'source /root/.versus_db_credentials',
    // 7. Cria usuário e banco versus_db no cluster 17
    `sudo -u postgres psql -p 5432 -c "DO \\$\\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'versus_user') THEN CREATE ROLE versus_user WITH LOGIN PASSWORD '$LOCAL_DB_PASS' CREATEDB; END IF; END \\$\\$;"`,
    `sudo -u postgres psql -p 5432 -c "ALTER ROLE versus_user WITH PASSWORD '$LOCAL_DB_PASS';"`,
    `sudo -u postgres psql -p 5432 -c "SELECT 1 FROM pg_database WHERE datname = 'versus_db';" | grep -q 1 || sudo -u postgres psql -p 5432 -c "CREATE DATABASE versus_db OWNER versus_user;"`,
    `sudo -u postgres psql -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE versus_db TO versus_user;"`,
    `sudo -u postgres psql -p 5432 -d versus_db -c "CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\";"`,
    `sudo -u postgres psql -p 5432 -d versus_db -c "CREATE EXTENSION IF NOT EXISTS \\"pgcrypto\\";"`,
    // 8. Testa conexão na porta 5432 com versus_user
    `source /root/.versus_db_credentials && PGPASSWORD="$LOCAL_DB_PASS" psql -h 127.0.0.1 -p 5432 -U versus_user -d versus_db -c "SELECT 'PostgreSQL 17 Pronto na porta 5432: ' || version();"`,
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      console.log(`Configuração do PG17 finalizada com código: ${code}`);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D' });

