const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec("sudo -u postgres psql -d versus_db -c \"SELECT DISTINCT metadata->>'lero_stage_name' as lero_stage, status, count(*) FROM \\\"Deal\\\" WHERE \\\"tenantId\\\" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' GROUP BY 1, 2 ORDER BY 3 DESC;\"", (err, stream) => {
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

