const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  // Let's query Postgres to verify the stored stages for Verto
  conn.exec("sudo -u postgres psql -d versus_db -c \"SELECT jsonb_array_length(\\\"crmStages\\\") as count, \\\"crmStages\\\"->8->>'title' as stage_8_title FROM \\\"Tenant\\\" WHERE id = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';\"", (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('Postgres stages check:\n', out);
      conn.end();
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

