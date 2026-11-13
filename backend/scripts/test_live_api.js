const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  conn.exec(`curl -s "http://localhost:3001/crm/radar-stories/viewers?tenantId=fc89e34b-2bc5-462d-9bfd-45b06e1d0126" | head -c 2000; echo ""; curl -s "http://localhost:3001/crm/radar-stories/posts/active?tenantId=fc89e34b-2bc5-462d-9bfd-45b06e1d0126"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Live API Response:\n' + out);
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
