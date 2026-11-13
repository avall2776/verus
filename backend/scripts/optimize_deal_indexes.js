const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    source /root/.versus_db_credentials && PGPASSWORD="$LOCAL_DB_PASS" psql -h 127.0.0.1 -p 5432 -U versus_user -d versus_db -c '
      CREATE INDEX IF NOT EXISTS "Deal_tenantId_updatedAt_idx" ON public."Deal" USING btree ("tenantId", "updatedAt" DESC);
      CREATE INDEX IF NOT EXISTS "Deal_tenantId_contactId_idx" ON public."Deal" USING btree ("tenantId", "contactId");
      CREATE INDEX IF NOT EXISTS "Deal_tenantId_assignedTo_idx" ON public."Deal" USING btree ("tenantId", "assignedTo");
      ANALYZE "Deal";
      ANALYZE "Contact";
    '
  `;

  conn.exec(query, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', code => {
      console.log('Indexes criados com sucesso!');
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});
