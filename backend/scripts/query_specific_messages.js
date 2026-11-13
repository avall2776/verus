const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
\\x auto

\\echo '=== BUSCANDO MENSAGENS AO REDOR DE 12:34 UTC (09:34 BRT) ==='
SELECT m."createdAt", m.direction, m.status, m.type, m.content, c.name, c.phone
FROM "Message" m
LEFT JOIN "Contact" c ON m."contactId" = c.id
WHERE m."createdAt" BETWEEN '2026-11-09 12:28:00' AND '2026-11-09 12:40:00'
ORDER BY m."createdAt" DESC;

\\echo '=== BUSCANDO O CONTATO 3199017694 EM QUALQUER PARTE DA BASE ==='
SELECT * FROM "Contact" WHERE phone LIKE '%99017694%' OR phone LIKE '%319901%' OR name ILIKE '%9901%';

\\echo '=== AS 4 MENSAGENS QUE ESTÃO COMO SENT HOJE ==='
SELECT m."createdAt", m.direction, m.status, m.type, m.content, c.name, c.phone
FROM "Message" m
LEFT JOIN "Contact" c ON m."contactId" = c.id
WHERE m."createdAt" >= '2026-11-09 00:00:00' AND m.direction = 'OUTBOUND' AND m.status = 'sent'
ORDER BY m."createdAt" DESC;

\\echo '=== AS 4 MENSAGENS QUE ESTÃO COMO NO_WHATSAPP E 1 FAILED HOJE ==='
SELECT m."createdAt", m.direction, m.status, m.type, m.content, c.name, c.phone
FROM "Message" m
LEFT JOIN "Contact" c ON m."contactId" = c.id
WHERE m."createdAt" >= '2026-11-09 00:00:00' AND m.direction = 'OUTBOUND' AND m.status IN ('failed', 'no_whatsapp')
ORDER BY m."createdAt" DESC;
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

