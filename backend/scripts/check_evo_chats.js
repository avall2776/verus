const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
curl -s -H "apikey: verto123" http://127.0.0.1:8080/chat/findChats/versus_fc89e34b2b_babdc262eb | head -c 1000
`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', (code) => {
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});
