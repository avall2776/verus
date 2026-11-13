const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const cmd = `
echo "=== PM2 STATUS ==="
pm2 status

echo "=== GIT STATUS BACKEND ==="
cd /root/verus/backend && git status -s && git log -n 1 --oneline

echo "=== CHECK LOSSREASON IN PRISMA ==="
grep -n "lossReason" /root/verus/backend/prisma/schema.prisma || echo "Not found in schema"
`;

  conn.exec(cmd, (err, stream) => {
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

