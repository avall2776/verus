const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const psqlScript = `
su - postgres -c "psql -d versus_db -c \\"UPDATE \\\\\\"Message\\\\\\" SET content = '👤 Contato: Viviane França Lima\\\\n📞 +55 62 99306-0982', type = 'contact' WHERE id = '42d08dd3-3670-43ce-a719-ce09f1f19a6b';\\""
su - postgres -c "psql -d versus_db -c \\"SELECT id, content, type FROM \\\\\\"Message\\\\\\" WHERE id = '42d08dd3-3670-43ce-a719-ce09f1f19a6b';\\""
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

