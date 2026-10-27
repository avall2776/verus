const { Client } = require('ssh2');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready, pulling and restarting versus-engine...');
  conn.exec(`
    cd /root/verus && \\
    git fetch origin main && \\
    git reset --hard origin/main && \\
    cd backend && \\
    npx prisma generate && \\
    npm run build && \\
    pm2 restart versus-engine && \\
    pm2 status
  `, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('Stream closed with code ' + code);
      console.log('Deployment Result:\n' + out);
      conn.end();
    }).on('data', (data) => {
      out += data;
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
