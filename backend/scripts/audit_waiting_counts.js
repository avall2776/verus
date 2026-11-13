const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  SELECT 
    d.name as dept_name, 
    count(c.id) as waiting_count
  FROM "Conversation" c
  JOIN "Department" d ON c."departmentId" = d.id
  WHERE c."assignedTo" IS NULL 
    AND c.status NOT IN ('resolved', 'closed')
    AND c."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
    AND d.id IN (
      '6dc14ed7-3074-40ec-89bb-88101906bf16', -- Região 1
      '2d07e3fc-0ea2-4ed8-a2ab-c76414b8051d', -- Região 5
      '62ae09af-810c-44e8-830e-aae9f156e5ba'  -- Região 6
    )
  GROUP BY d.name;
  
  SELECT 
    count(c.id) as comercial_waiting_count
  FROM "Conversation" c
  WHERE c."assignedTo" IS NULL 
    AND c.status NOT IN ('resolved', 'closed')
    AND c."departmentId" = 'c735ab57-dd57-4f86-b853-ff57b0c92847'; -- Comercial
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/query_waiting_counts.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/query_waiting_counts.sql', (err, stream) => {
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

