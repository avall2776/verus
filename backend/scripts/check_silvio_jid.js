const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const http = require('http');

async function check() {
  const postData = JSON.stringify({
    numbers: ["5563984841099", "556384841099"]
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/chat/whatsappNumbers/versus_fc89e34b2b_babdc262eb',
    method: 'POST',
    headers: {
      'apikey': 'verto123',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      console.log('Result:', data);
    });
  });
  req.write(postData);
  req.end();
}
check().catch(console.error);
`;

  conn.exec(`cat << 'EOF' > /root/check_silvio_jid.js\n${code}\nEOF\nnode /root/check_silvio_jid.js`, (err, stream) => {
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

