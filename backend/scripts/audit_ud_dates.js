const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT ud."userId", u.name, ud."departmentId", d.name as dept_name, ud."createdAt"
  FROM "UserDepartment" ud
  JOIN "User" u ON ud."userId" = u.id
  JOIN "Department" d ON ud."departmentId" = d.id
  WHERE u.name ILIKE '%Plinio%' OR u.name ILIKE '%Janaina%' OR u.name ILIKE '%Gabriel%';
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/query_ud_dates.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/query_ud_dates.sql', (err, stream) => {
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

