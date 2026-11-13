const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const query = `
    source /root/.versus_db_credentials && PGPASSWORD="$LOCAL_DB_PASS" psql -h 127.0.0.1 -p 5432 -U versus_user -d versus_db -c "
      EXPLAIN ANALYZE 
      SELECT c.id, c.status, c.\\"updatedAt\\", c.\\"departmentId\\", c.\\"assignedTo\\", ct.name 
      FROM \\"Conversation\\" c
      LEFT JOIN \\"Contact\\" ct ON c.\\"contactId\\" = ct.id
      WHERE c.\\"tenantId\\" = (SELECT id FROM \\"Tenant\\" LIMIT 1)
        AND c.status IN ('waiting', 'bot_active')
      ORDER BY c.\\"updatedAt\\" DESC
      LIMIT 100;
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
