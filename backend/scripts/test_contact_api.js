const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const http = require('http');

// Busca o token do primeiro usuário admin da Verto para testar a rota
const { Client: PgClient } = require('pg');
const fs = require('fs');

async function test() {
  const creds = fs.readFileSync('/root/.versus_db_credentials', 'utf8');
  const dbPass = creds.match(/LOCAL_DB_PASS="([^"]+)"/)[1];
  const pg = new PgClient({ connectionString: 'postgresql://versus_user:' + encodeURIComponent(dbPass) + '@127.0.0.1:5432/versus_db' });
  await pg.connect();

  const userRes = await pg.query("SELECT id, email, \\"tenantId\\" FROM \\"User\\" WHERE \\"tenantId\\" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' AND \\"isActive\\" = true LIMIT 1;");
  const user = userRes.rows[0];
  console.log("User:", user);

  // Testa diretamente no banco o que getConversationByContact faria
  const contactId = 'fe63529b-e4a6-4aec-a92b-c6f2a75edfb1';
  const convRes = await pg.query('SELECT * FROM "Conversation" WHERE "tenantId" = $1 AND "contactId" = $2', [user.tenantId, contactId]);
  console.log("Conversa encontrada no banco:", convRes.rows);

  await pg.end();
}
test().catch(console.error);
`;

  conn.exec(`node -e "${code.replace(/"/g, '\\"')}"`, (err, stream) => {
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

