const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `grep -rn -C 10 "274766288166951" /root/.pm2/logs/versus-engine-out.log 2>/dev/null`;
  conn.exec(cmd, (err, proc) => {
    if (err) throw err;
    proc.on('close', () => conn.end())
      .on('data', d => process.stdout.write(d))
      .stderr.on('data', d => process.stderr.write(d));
  });
}).on('error', console.error).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

