const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const newDbUrl = 'DATABASE_URL="postgresql://postgres.aoxajwlocxetfxthkdxa:xRR%40QZJ5g3UV%3F74@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"';
  const cmd = `
    sed -i '/DATABASE_URL=/c\\${newDbUrl}' /root/verus/backend/.env
    grep DATABASE_URL /root/verus/backend/.env
    pm2 restart versus-engine --update-env
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', (code) => {
      console.log('OUTPUT:\n', out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
