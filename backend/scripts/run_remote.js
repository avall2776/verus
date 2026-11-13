const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `ALTER TABLE "whatsapp_status_posts" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image'; ALTER TABLE "whatsapp_status_views" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';`;
  conn.exec(`psql -U postgres -d versus`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
    stream.write(sql + '\n\\q\n');
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});
