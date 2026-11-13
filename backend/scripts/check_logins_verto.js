const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT u.name, u.email, l."ipAddress", l."createdAt", l."userAgent"
    FROM login_audit_logs l
    JOIN "User" u ON l."userId" = u.id
    WHERE l."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      AND l."createdAt" >= CURRENT_DATE - INTERVAL '1 day'
    ORDER BY l."createdAt" DESC;
  `;

  conn.exec(`sudo -u postgres psql -d versus_db -c '${sql}'`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Logins:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

