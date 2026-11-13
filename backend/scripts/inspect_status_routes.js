const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`docker exec evolution-api grep -rn -A 20 "findMessages" /evolution/dist/src/api/routes/chat.router.js`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- findMessages in chat.router.js ---');
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
