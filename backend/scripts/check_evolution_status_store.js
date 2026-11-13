const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready, checking Evolution API status store...');
  conn.exec(`
    docker exec evolution-api ls -la /evolution/store/messages/versus_fc89e34b2b_babdc262eb/ 2>/dev/null | grep -i "status" | head -n 30
    echo "--- CHECKING STATUS MESSAGE RECEIPTS ---"
    docker exec evolution-api cat /evolution/store/messages/versus_fc89e34b2b_babdc262eb/status@broadcast.json 2>/dev/null | head -c 2000
    echo ""
    echo "--- CHECKING OTHER STATUS FILES ---"
    docker exec evolution-api find /evolution/store/ -name "*status*" 2>/dev/null
  `, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Result:\n' + out);
      conn.end();
    }).on('data', (data) => {
      out += data;
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
