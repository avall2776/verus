const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const sql = `
\\x auto

\\echo '=== BUSCANDO DEAL DE THIAGO CASTILHO ==='
SELECT id, title, "contactId", "tenantId", "status", metadata
FROM "Deal"
WHERE title ILIKE '%Thiago Castilho%' OR metadata::text LIKE '%5518997777766%' OR id::text LIKE '%49bc8f0%'
LIMIT 5;

\\echo '=== BUSCANDO CONTATO DE THIAGO CASTILHO ==='
SELECT id, name, phone, email, "tenantId"
FROM "Contact"
WHERE name ILIKE '%Thiago Castilho%' OR phone LIKE '%18997777766%' OR email LIKE '%tcast@hotmail.com%'
LIMIT 5;

\\echo '=== BUSCANDO CONVERSA DE THIAGO CASTILHO ==='
SELECT conv.id, conv."contactId", conv.status, conv."tenantId", c.name, c.phone
FROM "Conversation" conv
JOIN "Contact" c ON conv."contactId" = c.id
WHERE c.name ILIKE '%Thiago Castilho%' OR c.phone LIKE '%18997777766%'
LIMIT 5;
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

