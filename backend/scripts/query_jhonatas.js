const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `SELECT c.name, c.phone, m.id, m.content, m.status, m."fromMe", m."createdAt" FROM "Contact" c LEFT JOIN "Message" m ON m."contactId" = c.id WHERE c.phone LIKE '%992879466%' ORDER BY m."createdAt" DESC LIMIT 10;\n\\q\n`;
  conn.exec(`sudo -u postgres psql -d versus_db`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
    stream.write(sql);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});
