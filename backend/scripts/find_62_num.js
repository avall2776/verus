const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const psqlScript = `su - postgres -c "psql -d versus_db -c \\"SELECT id, name, phone, \\\\\\"whatsappLid\\\\\\" FROM \\\\\\"Contact\\\\\\" WHERE phone LIKE '%9306%0982%' OR \\\\\\"whatsappLid\\\\\\" LIKE '%9306%0982%';\\""`;

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
