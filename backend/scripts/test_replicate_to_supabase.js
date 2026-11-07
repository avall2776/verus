const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Testando replicação do backup local para o Supabase Ohio...');

  const cmd = `
    echo "1. Gerando dump limpo do public schema do banco local..."
    source /root/.versus_db_credentials
    PGPASSWORD="$LOCAL_DB_PASS" /usr/lib/postgresql/17/bin/pg_dump -h 127.0.0.1 -p 5432 -U versus_user -d versus_db --schema=public --clean --if-exists --no-owner --no-acl > /tmp/versus_public_sync.sql
    echo "Tamanho do dump SQL:"
    ls -lh /tmp/versus_public_sync.sql

    echo "2. Restaurando no Supabase Ohio..."
    PGPASSWORD="xRR@QZJ5g3UV?74" psql -h aws-0-us-east-2.pooler.supabase.com -p 5432 -U postgres.aoxajwlocxetfxthkdxa -d postgres -f /tmp/versus_public_sync.sql > /tmp/supabase_restore.log 2>&1 || true
    
    echo "3. Verificando resultado da sincronização..."
    tail -n 15 /tmp/supabase_restore.log
    
    echo "4. Auditando contagem de registros no Supabase após sincronização:"
    PGPASSWORD="xRR@QZJ5g3UV?74" psql -h aws-0-us-east-2.pooler.supabase.com -p 5432 -U postgres.aoxajwlocxetfxthkdxa -d postgres -c '
      SELECT 
        (SELECT count(*) FROM "Contact") as contacts,
        (SELECT count(*) FROM "Message") as messages,
        (SELECT count(*) FROM "Deal") as deals,
        (SELECT count(*) FROM "Conversation") as conversations;
    '
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log('Fim do teste de replicação com código:', code);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});
