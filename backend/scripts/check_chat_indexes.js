const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    source /root/.versus_db_credentials && PGPASSWORD="$LOCAL_DB_PASS" psql -h 127.0.0.1 -p 5432 -U versus_user -d versus_db -c "
      SELECT 'Message' as tbl, indexname, indexdef FROM pg_indexes WHERE tablename = 'Message'
      UNION ALL
      SELECT 'Conversation' as tbl, indexname, indexdef FROM pg_indexes WHERE tablename = 'Conversation';
    "
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

