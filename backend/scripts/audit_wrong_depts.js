const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT 
    c.id,
    co.name as contact_name, 
    co.phone, 
    d.name as dept_name,
    c.status,
    c."createdAt",
    c."updatedAt"
  FROM "Conversation" c
  JOIN "Contact" co ON c."contactId" = co.id
  LEFT JOIN "Department" d ON c."departmentId" = d.id
  WHERE c."assignedTo" = '5353b252-8843-45b9-bd77-89e1e341dccd'
    AND c."departmentId" NOT IN (
      '6dc14ed7-3074-40ec-89bb-88101906bf16', -- Região 1
      '62ae09af-810c-44e8-830e-aae9f156e5ba', -- Região 6
      '2d07e3fc-0ea2-4ed8-a2ab-c76414b8051d'  -- Região 5
    )
  ORDER BY c."updatedAt" DESC
  LIMIT 15;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/query_wrong_depts.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/query_wrong_depts.sql', (err, stream) => {
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

