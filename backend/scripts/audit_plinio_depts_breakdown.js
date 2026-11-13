const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT 
    d.id as dept_id,
    COALESCE(d.name, 'SEM DEPARTAMENTO') as dept_name,
    COUNT(*) as total_convs,
    COUNT(*) FILTER (WHERE c.status IN ('open', 'human_takeover', 'in_progress')) as active_convs,
    COUNT(*) FILTER (WHERE c.status IN ('resolved', 'closed')) as resolved_convs
  FROM "Conversation" c
  LEFT JOIN "Department" d ON c."departmentId" = d.id
  WHERE c."assignedTo" = '5353b252-8843-45b9-bd77-89e1e341dccd'
  GROUP BY d.id, d.name
  ORDER BY total_convs DESC;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/audit_plinio_depts_breakdown.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/audit_plinio_depts_breakdown.sql', (err, stream) => {
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

