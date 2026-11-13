const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const psqlScript = `su - postgres -c "psql -d versus_db -c \\"SELECT id, content, type FROM \\\\\\"Message\\\\\\" WHERE \\\\\\"conversationId\\\\\\" = '5d2ef975-32d2-4027-bcb4-e5908bbe77e7' ORDER BY \\\\\\"createdAt\\\\\\" ASC;\\""`;

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

