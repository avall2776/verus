const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const curlCmd = `curl -s -X POST http://localhost:8080/chat/findMessages/versus_fc89e34b2b_babdc262eb -H "apikey: verto123" -H "Content-Type: application/json" -d '{"where":{"key":{"remoteJid":"status@broadcast"}},"limit":5}'`;
  conn.exec(curlCmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('OUTPUT:\n' + out.substring(0, 1000));
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
