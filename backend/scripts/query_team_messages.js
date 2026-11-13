const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
\\x auto

\\echo '=== ÚLTIMAS 15 MENSAGENS DO CHAT INTERNO (TeamMessage) ==='
SELECT tm.id, tm."createdAt", tm."senderId", tm."receiverId", tm."channelId", tm.content, tm."mediaUrl", u.name as sender_name
FROM "TeamMessage" tm
LEFT JOIN "User" u ON tm."senderId" = u.id
ORDER BY tm."createdAt" DESC
LIMIT 15;
`;

  conn.exec(`su - postgres -c "psql -d versus_db"`, (err, stream) => {
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
  password: 'g@nY;+OWkSdi5.3D'
});

