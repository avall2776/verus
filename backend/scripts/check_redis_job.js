const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
su - postgres -c "psql -d versus_db -c \"SELECT 1;\"" # check db
redis-cli get "bull:ingress-queue:msg_3AB0D72CF8F21AB34EAD" || echo "not found by key"
redis-cli hgetall "bull:ingress-queue:msg_3AB0D72CF8F21AB34EAD"
`;
  conn.exec(cmd, (err, stream) => {
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

