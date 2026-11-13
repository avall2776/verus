const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `docker inspect evolution-api --format '{{ range .Mounts }}{{ .Source }} -> {{ .Destination }}{{ "\\n" }}{{ end }}'`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('MOUNTS:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
