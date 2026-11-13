const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
redis-cli keys "*3AB0D72C*"
redis-cli keys "bull:*" | head -n 30
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

