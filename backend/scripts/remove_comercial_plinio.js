const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
  -- Remove Comercial from Plinio's departments
  DELETE FROM "UserDepartment" 
  WHERE "userId" = '5353b252-8843-45b9-bd77-89e1e341dccd' 
    AND "departmentId" = 'c735ab57-dd57-4f86-b853-ff57b0c92847';
  
  -- Verify remaining departments for Plinio
  SELECT ud."departmentId", d.name 
  FROM "UserDepartment" ud 
  JOIN "Department" d ON ud."departmentId" = d.id 
  WHERE ud."userId" = '5353b252-8843-45b9-bd77-89e1e341dccd';
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/remove_comercial_plinio.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/remove_comercial_plinio.sql', (err, stream) => {
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

