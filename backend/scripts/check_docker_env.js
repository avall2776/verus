const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`docker inspect evolution-api --format '{{json .Config.Env}}'`, (err, proc) => {
    let out = '';
    proc.on('close', () => {
      try {
        const envs = JSON.parse(out);
        envs.forEach(e => {
          if (/DATABASE|POSTGRES|REDIS|AUTH|S3/i.test(e)) console.log(e);
        });
      } catch(e) {
        console.log('Raw:', out.slice(0, 500));
      }
      conn.end();
    })
    .on('data', d => out += d);
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

