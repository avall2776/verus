const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const psqlScript = `
su - postgres -c "psql -d versus_db -c \\"UPDATE \\\\\\"Contact\\\\\\" SET phone = '556384841099' WHERE id = '10177ff4-5bc5-4526-b8a1-b1a5e3c40cd8';\\""
su - postgres -c "psql -d versus_db -c \\"SELECT id, name, phone, \\\\\\"whatsappLid\\\\\\" FROM \\\\\\"Contact\\\\\\" WHERE id = '10177ff4-5bc5-4526-b8a1-b1a5e3c40cd8';\\""
`;

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

