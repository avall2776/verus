const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('sudo -u postgres psql -d versus_db -c "SELECT id, name, email, role, \\"tenantId\\", \\"isActive\\" FROM \\"User\\" WHERE name ILIKE \'%Plinio%\' OR email ILIKE \'%plinio%\' OR name ILIKE \'%Parisotto%\';"', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

