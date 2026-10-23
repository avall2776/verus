const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('docker inspect evolution-api', (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('data', d => data += d.toString());
    stream.on('close', () => {
      try {
        const json = JSON.parse(data);
        console.log("Env:", json[0].Config.Env);
      } catch (e) {
        console.log("Raw output:", data.substring(0, 500));
      }
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
