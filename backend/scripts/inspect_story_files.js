const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    docker exec evolution-api cat /evolution/store/messages/versus_fc89e34b2b_babdc262eb/3EB0779B87CE066277CA15.json 2>/dev/null
    echo "=== SECOND STORY FILE ==="
    docker exec evolution-api cat /evolution/store/messages/versus_fc89e34b2b_babdc262eb/3EB02EA7DB0AF04E55CDA4.json 2>/dev/null
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('OUTPUT:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
