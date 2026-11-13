const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const psqlScript = `
echo "=== 1. BUSCANDO OS CONTATOS DA IMAGEM ==="
su - postgres -c "psql -d versus_db -c \\"SELECT id, name, phone, \\\\\\"whatsappLid\\\\\\", \\\\\\"tenantId\\\\\\" FROM \\\\\\"Contact\\\\\\" WHERE phone LIKE '%8136%3966%' OR phone LIKE '%9916%8982%' OR phone LIKE '%8484%1099%' OR \\\\\\"whatsappLid\\\\\\" LIKE '%8136%3966%' OR \\\\\\"whatsappLid\\\\\\" LIKE '%9916%8982%' OR \\\\\\"whatsappLid\\\\\\" LIKE '%8484%1099%';\\""

echo "=== 2. MENSAGENS RECENTES DESSES CONTATOS ==="
su - postgres -c "psql -d versus_db -c \\"SELECT m.id, c.name, c.phone, m.direction, m.status, m.type, LEFT(m.content, 40) as content, LEFT(m.\\\\\\"mediaUrl\\\\\\", 40) as media, m.\\\\\\"createdAt\\\\\\", m.\\\\\\"providerMessageId\\\\\\" FROM \\\\\\"Message\\\\\\" m JOIN \\\\\\"Contact\\\\\\" c ON m.\\\\\\"contactId\\\\\\" = c.id WHERE c.phone LIKE '%8136%3966%' OR c.phone LIKE '%9916%8982%' OR c.phone LIKE '%8484%1099%' ORDER BY m.\\\\\\"createdAt\\\\\\" DESC LIMIT 20;\\""

echo "=== 3. TODAS AS MENSAGENS OUTBOUND HOJE APÓS 13:00 ==="
su - postgres -c "psql -d versus_db -c \\"SELECT m.id, c.name, c.phone, m.direction, m.status, m.type, LEFT(m.content, 40) as content, m.\\\\\\"createdAt\\\\\\", m.\\\\\\"providerMessageId\\\\\\" FROM \\\\\\"Message\\\\\\" m JOIN \\\\\\"Contact\\\\\\" c ON m.\\\\\\"contactId\\\\\\" = c.id WHERE m.\\\\\\"createdAt\\\\\\" >= '2026-11-09 13:00:00' AND m.direction = 'OUTBOUND' ORDER BY m.\\\\\\"createdAt\\\\\\" DESC LIMIT 30;\\""
`;

  conn.exec(psqlScript, (err, stream) => {
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
