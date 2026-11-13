const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Message' ORDER BY ordinal_position;
    SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%session%' OR table_name ILIKE '%login%' OR table_name ILIKE '%audit%';
  `;
  conn.exec(`sudo -u postgres psql -d versus_db -c "${sql}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

