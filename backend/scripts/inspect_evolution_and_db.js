const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = Buffer.from(`
const { Client } = require("pg");
const fs = require("fs");

async function check() {
  const creds = fs.readFileSync("/root/.versus_db_credentials", "utf8");
  const dbPass = creds.match(/LOCAL_DB_PASS="([^"]+)"/)[1];
  const client = new Client({ connectionString: "postgresql://versus_user:" + encodeURIComponent(dbPass) + "@127.0.0.1:5432/versus_db" });
  await client.connect();

  console.log("=== 1. ÚLTIMAS 30 MENSAGENS ENVIADAS (OUTBOUND) ===");
  const outRes = await client.query(\`
    SELECT m.id, m.status, m.type, LEFT(m.content, 45) as content, m."createdAt", c.name as contact, c.phone
    FROM "Message" m
    LEFT JOIN "Contact" c ON m."contactId" = c.id
    WHERE m.direction = 'OUTBOUND'
    ORDER BY m."createdAt" DESC
    LIMIT 30;
  \`);
  for (const r of outRes.rows) {
    console.log(r.createdAt.toISOString() + " | Status: " + r.status.padEnd(10) + " | Para: " + (r.contact || "").padEnd(20) + " (" + (r.phone || "").padEnd(14) + ") | " + r.content);
  }

  console.log("\\n=== 2. MENSAGENS COM STATUS != DELIVERED/READ DE HOJE ===");
  const undelivered = await client.query(\`
    SELECT m.id, m.direction, m.status, m.type, LEFT(m.content, 45) as content, m."createdAt", c.name as contact, c.phone
    FROM "Message" m
    LEFT JOIN "Contact" c ON m."contactId" = c.id
    WHERE m."createdAt" >= '2026-11-09 00:00:00'
      AND m.direction = 'OUTBOUND'
      AND m.status NOT IN ('DELIVERED', 'READ')
    ORDER BY m."createdAt" DESC;
  \`);
  console.log("Total undelivered today: " + undelivered.rows.length);
  for (const r of undelivered.rows) {
    console.log(r.createdAt.toISOString() + " | Status: " + r.status.padEnd(10) + " | Para: " + (r.contact || "").padEnd(20) + " (" + (r.phone || "").padEnd(14) + ") | " + r.content);
  }

  console.log("\\n=== 3. CONTATOS DA IMAGEM DO USUÁRIO ===");
  const imgNumbers = ['%3199017694%', '%3599133202%', '%6499491700%'];
  for (const num of imgNumbers) {
    const cRes = await client.query('SELECT id, name, phone, "lid" FROM "Contact" WHERE phone LIKE $1', [num]);
    console.log("Contato " + num + ":", cRes.rows);
    if (cRes.rows[0]) {
      const mRes = await client.query('SELECT id, direction, status, type, content, "createdAt" FROM "Message" WHERE "contactId" = $1 ORDER BY "createdAt" DESC LIMIT 5', [cRes.rows[0].id]);
      console.log("  Mensagens:", mRes.rows);
    }
  }

  await client.end();
}
check().catch(console.error);
`).toString('base64');

  const cmd = `echo "${code}" | base64 -d > /root/run_check.js && cd /root/verus/backend && node /root/run_check.js`;
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
