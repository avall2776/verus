const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `curl -s http://localhost:8080/webhook/find/versus_fc89e34b2b_babdc262eb -H "apikey: verto123"`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Webhook config in Evolution API:');
      console.log(out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
