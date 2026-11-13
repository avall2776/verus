const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
docker logs --tail 2000 evolution-api 2>&1 | grep -C 5 "3AB0D72CF8F21AB34EAD" || echo "Not in docker logs"
grep -C 5 "3AB0D72CF8F21AB34EAD" /root/.pm2/logs/versus-engine-out.log || echo "Not in pm2 out log"
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

