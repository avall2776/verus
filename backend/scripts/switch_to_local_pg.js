const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Iniciando virada de chave para o PostgreSQL Local 17...');

  const commands = [
    // 1. Backup de segurança do .env atual
    'cp /root/verus/backend/.env /root/verus/backend/.env.backup_supabase_ohio',
    // 2. Extrai a senha salva do banco local
    'source /root/.versus_db_credentials',
    // 3. Monta a nova DATABASE_URL para 127.0.0.1:5432
    'NEW_DB_URL="postgresql://versus_user:"$LOCAL_DB_PASS"@127.0.0.1:5432/versus_db?connection_limit=40"',
    // 4. Substitui a DATABASE_URL no .env
    'node -e "const fs = require(\'fs\'); let c = fs.readFileSync(\'/root/verus/backend/.env\', \'utf8\'); c = c.replace(/DATABASE_URL=.*/, \'DATABASE_URL=\"\' + process.env.NEW_DB_URL + \'\"\'); fs.writeFileSync(\'/root/verus/backend/.env\', c);"',
    'grep "DATABASE_URL" /root/verus/backend/.env',
    // 5. Reinicia o versus-engine com as novas variáveis de ambiente
    'pm2 restart versus-engine --update-env',
    'sleep 3',
    'pm2 status',
    // 6. Teste de saúde da aplicação conectada no banco local
    'curl -s http://127.0.0.1:3001/auth/admin/sessions | head -c 100 || true',
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      console.log(`\nVirada de chave concluída com código: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

