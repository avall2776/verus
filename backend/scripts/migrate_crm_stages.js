const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
    ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "crmStages" jsonb;
    ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "crmFunnelName" text;
  `;
  conn.exec(`sudo -u postgres psql -d versus_db -c '${sql}'`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Postgres migration result:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

