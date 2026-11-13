const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Executando Dump do Supabase Ohio e Restauração no PostgreSQL 17 Local...');

  const commands = [
    'echo "[1/4] Iniciando pg_dump (schema public) do Supabase Ohio..."',
    'PGPASSWORD="xRR@QZJ5g3UV?74" /usr/lib/postgresql/17/bin/pg_dump -h aws-0-us-east-2.pooler.supabase.com -p 5432 -U postgres.aoxajwlocxetfxthkdxa -d postgres --schema=public --no-owner --no-acl --clean --if-exists -f /root/supabase_public_dump.sql',
    'echo "[2/4] Dump concluído com sucesso! Tamanho do arquivo gerado:"',
    'ls -lh /root/supabase_public_dump.sql',
    'echo "[3/4] Restaurando dump no PostgreSQL 17 Local (versus_db)..."',
    'source /root/.versus_db_credentials && PGPASSWORD="$LOCAL_DB_PASS" /usr/lib/postgresql/17/bin/psql -h 127.0.0.1 -p 5432 -U versus_user -d versus_db -f /root/supabase_public_dump.sql > /root/restore_progress.log 2>&1',
    'echo "[4/4] Restauração concluída! Verificando tabelas criadas no versus_db local:"',
    'source /root/.versus_db_credentials && PGPASSWORD="$LOCAL_DB_PASS" /usr/lib/postgresql/17/bin/psql -h 127.0.0.1 -p 5432 -U versus_user -d versus_db -c "\\dt"',
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      console.log(`\nDump e Restauração finalizados com código: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});
