const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT 
    u.id, 
    u.name, 
    u.email, 
    u.role,
    STRING_AGG(d.name, ', ') as departments
  FROM "User" u
  JOIN "Tenant" t ON u."tenantId" = t.id
  LEFT JOIN "UserDepartment" ud ON u.id = ud."userId"
  LEFT JOIN "Department" d ON ud."departmentId" = d.id
  WHERE t.name ILIKE '%Verto%'
  GROUP BY u.id, u.name, u.email, u.role
  ORDER BY u.name;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/query_users_depts.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/query_users_depts.sql', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', (d) => out += d);
        stream.stderr.on('data', (d) => out += d);
        stream.on('close', () => {
          console.log('Output:\n', out);
          conn.end();
        });
      });
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

