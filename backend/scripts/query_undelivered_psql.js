const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
\\x auto

\\echo '=== 1. ÚLTIMAS 15 MENSAGENS OUTBOUND HOJE ==='
SELECT m."createdAt", m.status, m.type, LEFT(m.content, 45) as content, c.name as contact, c.phone
FROM "Message" m
LEFT JOIN "Contact" c ON m."contactId" = c.id
WHERE m."createdAt" >= '2026-11-09 00:00:00' AND m.direction = 'OUTBOUND'
ORDER BY m."createdAt" DESC
LIMIT 15;

\\echo '=== 2. MENSAGENS NÃO ENTREGUES DE HOJE (OUTBOUND COM STATUS != DELIVERED E != READ) ==='
SELECT m."createdAt", m.status, m.type, LEFT(m.content, 50) as content, c.name, c.phone
FROM "Message" m
LEFT JOIN "Contact" c ON m."contactId" = c.id
WHERE m."createdAt" >= '2026-11-09 00:00:00'
  AND m.direction = 'OUTBOUND'
  AND m.status NOT IN ('DELIVERED', 'READ')
ORDER BY m."createdAt" DESC;

\\echo '=== 3. CONTATOS DA IMAGEM (+55 31 9901-7694, +55 35 9913-3202, +55 64 9949-1700) ==='
SELECT id, name, phone, "lid", "createdAt", "updatedAt"
FROM "Contact"
WHERE phone LIKE '%3199017694%' OR phone LIKE '%3599133202%' OR phone LIKE '%6499491700%';

\\echo '=== 4. MENSAGENS DESSES 3 CONTATOS ==='
SELECT m."createdAt", m.direction, m.status, m.type, LEFT(m.content, 60) as content, c.phone
FROM "Message" m
JOIN "Contact" c ON m."contactId" = c.id
WHERE c.phone LIKE '%3199017694%' OR c.phone LIKE '%3599133202%' OR c.phone LIKE '%6499491700%'
ORDER BY m."createdAt" DESC;

\\echo '=== 5. RESUMO DE TODAS AS MENSAGENS DE HOJE ==='
SELECT direction, status, count(*) 
FROM "Message"
WHERE "createdAt" >= '2026-11-09 00:00:00'
GROUP BY direction, status;
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
