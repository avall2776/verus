const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT d.id, d.name, d.color, count(c.id) as conv_count
  FROM "Department" d
  LEFT JOIN "Conversation" c ON d.id = c."departmentId"
  WHERE d."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
  GROUP BY d.id, d.name, d.color
  ORDER BY conv_count DESC;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/query_depts_list.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/query_depts_list.sql', (err, stream) => {
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

