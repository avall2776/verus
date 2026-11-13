const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const psqlScript = `su - postgres -c "psql -d versus_db -c \\"SELECT id, name, phone, \\\\\\"whatsappLid\\\\\\" FROM \\\\\\"Contact\\\\\\" WHERE name ILIKE '%Marquinhos%' OR name ILIKE '%Lavoura%' OR phone LIKE '%9916%8982%';\\""`;

  conn.exec(psqlScript, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

