const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `SELECT c.\\"departmentId\\", d.name, count(*) FROM \\"Conversation\\" c LEFT JOIN \\"Department\\" d ON c.\\"departmentId\\" = d.id WHERE c.\\"assignedTo\\" = '5353b252-8843-45b9-bd77-89e1e341dccd' GROUP BY c.\\"departmentId\\", d.name;`;
  conn.exec(`sudo -u postgres psql -d versus_db -c "${sql}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', (d) => out += d);
    stream.on('close', () => {
      console.log('Conversation departments:', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });
