const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT 
    c.id, 
    co.name as contact_name, 
    u.name as assigned_to_name,
    d.name as dept_name,
    c.status,
    TO_CHAR(c."updatedAt", 'YYYY-MM-DD HH24:MI:SS') as updated_at
  FROM "Conversation" c
  LEFT JOIN "Contact" co ON c."contactId" = co.id
  LEFT JOIN "User" u ON c."assignedTo" = u.id
  LEFT JOIN "Department" d ON c."departmentId" = d.id
  WHERE c."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
  ORDER BY c."updatedAt" DESC
  LIMIT 20;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/audit_recent_activity.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/audit_recent_activity.sql', (err, stream) => {
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

