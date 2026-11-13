const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
    curl -s -X POST http://localhost:8080/chat/findStatusMessage/versus_fc89e34b2b_babdc262eb \
      -H "apikey: verto123" \
      -H "Content-Type: application/json" \
      -d '{}'
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('findStatusMessage response:');
      try {
        const parsed = JSON.parse(out);
        console.log('Array length:', Array.isArray(parsed) ? parsed.length : 'not array');
        console.log('Sample:', JSON.stringify(parsed, null, 2).slice(0, 1500));
      } catch (e) {
        console.log('Raw output:', out.slice(0, 1000));
      }
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
