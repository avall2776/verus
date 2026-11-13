const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    PGPASSWORD="xRR@QZJ5g3UV?74" psql -h aws-0-us-east-2.pooler.supabase.com -p 5432 -U postgres.aoxajwlocxetfxthkdxa -d postgres -c '
      SELECT 
        (SELECT count(*) FROM "Contact") as contacts,
        (SELECT count(*) FROM "Message") as messages,
        (SELECT count(*) FROM "Deal") as deals,
        (SELECT count(*) FROM "Conversation") as conversations,
        (SELECT count(*) FROM "User") as users,
        (SELECT count(*) FROM "active_sessions") as sessions;
    '
  `;

  conn.exec(query, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
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

