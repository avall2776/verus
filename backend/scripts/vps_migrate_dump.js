const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Iniciando Dump do Supabase e Restauração no PostgreSQL Local...');

  const supabaseUrl = 'postgresql://postgres.aoxajwlocxetfxthkdxa:xRR%40QZJ5g3UV%3F74@aws-0-us-east-2.pooler.supabase.com:5432/postgres';

  const commands = [
    // 1. Extração segura com pg_dump (schema public, com dados, ignorando tabelas internas do supabase como auth, storage, vault, etc.)
    `echo "Iniciando pg_dump do Supabase Ohio..."`,
    `PGPASSWORD="xRR@QZJ5g3UV?74" pg_dump -h aws-0-us-east-2.pooler.supabase.com -p 5432 -U postgres.aoxajwlocxetfxthkdxa -d postgres --schema=public --no-owner --no-acl --clean --if-exists -f /root/supabase_public_dump.sql`,
    `echo "Dump concluído! Tamanho do arquivo:"`,
    `ls -lh /root/supabase_public_dump.sql`,
    // 2. Garante extensões necessárias no banco local versus_db
    `sudo -u postgres psql -d versus_db -c "CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\";"`,
    `sudo -u postgres psql -d versus_db -c "CREATE EXTENSION IF NOT EXISTS \\"pgcrypto\\";"`,
    // 3. Restauração no banco local versus_db
    `echo "Restaurando dump no PostgreSQL Local da VPS (versus_db)..."`,
    `source /root/.versus_db_credentials && PGPASSWORD="$LOCAL_DB_PASS" psql -h 127.0.0.1 -U versus_user -d versus_db -f /root/supabase_public_dump.sql > /root/restore.log 2>&1 || true`,
    `echo "Restauração finalizada! Linhas do log de restauração:"`,
    `tail -n 20 /root/restore.log`,
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;

    stream.on('data', (d) => process.stdout.write(d));
    stream.stderr.on('data', (d) => process.stderr.write(d));
    stream.on('close', (code) => {
      console.log(`\nProcesso de migração concluído com código: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

