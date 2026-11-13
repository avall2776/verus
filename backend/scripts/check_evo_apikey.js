const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`docker inspect evolution-api --format '{{json .Config.Env}}'`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      try {
        const envs = JSON.parse(out);
        console.log(envs.filter(e => e.includes('API_KEY')));
      } catch (e) {
        console.log(out);
      }
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

