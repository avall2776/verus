const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT 
    c.id,
    co.name as contact_name, 
    co.phone, 
    c."assignedTo",
    u.name as operator_name,
    u.email as operator_email,
    d.name as dept_name, 
    c.status,
    TO_CHAR(c."updatedAt", 'DD/MM/YYYY HH24:MI') as updated
  FROM "Conversation" c
  JOIN "Contact" co ON c."contactId" = co.id
  LEFT JOIN "User" u ON c."assignedTo" = u.id
  LEFT JOIN "Department" d ON c."departmentId" = d.id
  WHERE co.name ILIKE '%Rodrigo Semeadora%' OR co.name ILIKE '%Rafael Frete%' OR co.name ILIKE '%Antonio Jose%' OR co.name ILIKE '%Antônio José%'
  ORDER BY c."updatedAt" DESC;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/query_aguardando.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/query_aguardando.sql', (err, stream) => {
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

