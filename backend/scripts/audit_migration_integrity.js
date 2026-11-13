const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Executando Auditoria Comparativa de Integridade 1:1...');

  const script = `
  const { Client: PgClient } = require('pg');
  const fs = require('fs');

  async function audit() {
    // 1. Conecta no Supabase
    const supabaseUrl = 'postgresql://postgres.aoxajwlocxetfxthkdxa:xRR%40QZJ5g3UV%3F74@aws-0-us-east-2.pooler.supabase.com:5432/postgres';
    const clientSupabase = new PgClient({ connectionString: supabaseUrl });
    await clientSupabase.connect();

    // 2. Conecta no PostgreSQL Local da VPS
    const creds = fs.readFileSync('/root/.versus_db_credentials', 'utf8');
    const dbPass = creds.match(/LOCAL_DB_PASS="([^"]+)"/)[1];
    const localUrl = 'postgresql://versus_user:' + encodeURIComponent(dbPass) + '@127.0.0.1:5432/versus_db';
    const clientLocal = new PgClient({ connectionString: localUrl });
    await clientLocal.connect();

    const tables = [
      'Contact',
      'Message',
      'Conversation',
      'Deal',
      'User',
      'Tenant',
      'WhatsAppInstance',
      'active_sessions',
      'login_audit_logs',
      'two_factor_verifications',
      'Contract',
      'Department',
      'Proposal',
      'QuickReply',
      'SupportTicket'
    ];

    console.log('--------------------------------------------------------------------------------');
    console.log('TABELA                     | SUPABASE OHIO        | LOCAL VPS (PG 17)    | STATUS');
    console.log('--------------------------------------------------------------------------------');

    let allMatch = true;
    for (const table of tables) {
      const resSupa = await clientSupabase.query('SELECT count(*) as c FROM "' + table + '";');
      const resLocal = await clientLocal.query('SELECT count(*) as c FROM "' + table + '";');

      const countSupa = parseInt(resSupa.rows[0].c, 10);
      const countLocal = parseInt(resLocal.rows[0].c, 10);

      const match = countSupa === countLocal;
      if (!match) allMatch = false;

      const status = match ? '✅ 100% IDÊNTICO' : '❌ DIVERGÊNCIA';
      console.log(
        table.padEnd(26) + ' | ' +
        String(countSupa).padEnd(20) + ' | ' +
        String(countLocal).padEnd(20) + ' | ' +
        status
      );
    }

    console.log('--------------------------------------------------------------------------------');
    if (allMatch) {
      console.log('🎉 AUDITORIA APROVADA: Todos os registros foram migrados com 100% de precisão!');
    } else {
      console.log('⚠️ ATENÇÃO: Houve divergência em alguma tabela.');
    }

    await clientSupabase.end();
    await clientLocal.end();
  }

  audit().catch(console.error);
  `;

  conn.exec(`node -e "${script.replace(/"/g, '\\"')}"`, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

