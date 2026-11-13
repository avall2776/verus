const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
ls -la /opt/evolution-api
cat /opt/evolution-api/docker-compose.yml 2>/dev/null || cat /opt/evolution-api/docker-compose.yaml 2>/dev/null || cat /opt/evolution-api/.env 2>/dev/null
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

