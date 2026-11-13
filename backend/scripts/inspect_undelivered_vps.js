const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const { Client } = require("pg");
const fs = require("fs");

async function run() {
  const creds = fs.readFileSync("/root/.versus_db_credentials", "utf8");
  const dbPass = creds.match(/LOCAL_DB_PASS="([^"]+)"/)[1];
  const client = new Client({ connectionString: "postgresql://versus_user:" + encodeURIComponent(dbPass) + "@127.0.0.1:5432/versus_db" });
  await client.connect();

  console.log("=== 1. BUSCANDO OS CONTATOS DA IMAGEM ===");
  const numbers = ["%3199017694%", "%3599133202%", "%6499491700%"];
  for (const num of numbers) {
    const res = await client.query('SELECT id, name, phone, "lid" FROM "Contact" WHERE phone LIKE $1 OR "lid" LIKE $1', [num]);
    console.log("Contact for " + num + ":", JSON.stringify(res.rows));
  }

  console.log("\\n=== 2. MENSAGENS DOS CONTATOS DA IMAGEM ===");
  const msgsQuery = \`
    SELECT m.id, m."conversationId", m."contactId", m.direction, m.status, m.type, m.content, m."createdAt", c.name as contact_name, c.phone as contact_phone
    FROM "Message" m
    LEFT JOIN "Contact" c ON m."contactId" = c.id
    WHERE c.phone LIKE '%3199017694%' OR c.phone LIKE '%3599133202%' OR c.phone LIKE '%6499491700%'
    ORDER BY m."createdAt" DESC
    LIMIT 20;
  \`;
  const msgsRes = await client.query(msgsQuery);
  console.log("Found " + msgsRes.rows.length + " messages for image contacts:");
  for (const row of msgsRes.rows) {
    console.log(JSON.stringify(row));
  }

  console.log("\\n=== 3. TODAS AS MENSAGENS OUTBOUND DE HOJE COM STATUS != DELIVERED/READ ===");
  const undeliveredQuery = \`
    SELECT m.id, m."conversationId", m.direction, m.status, m.type, m.content, m."createdAt", c.name as contact_name, c.phone as contact_phone
    FROM "Message" m
    LEFT JOIN "Contact" c ON m."contactId" = c.id
    WHERE m."createdAt" >= '2026-11-09 00:00:00'
      AND m.direction = 'OUTBOUND'
      AND m.status != 'DELIVERED'
      AND m.status != 'READ'
    ORDER BY m."createdAt" DESC;
  \`;
  const undeliveredRes = await client.query(undeliveredQuery);
  console.log("Found " + undeliveredRes.rows.length + " undelivered outbound messages today:");
  for (const row of undeliveredRes.rows) {
    console.log(JSON.stringify(row));
  }

  console.log("\\n=== 4. RESUMO GERAL DAS MENSAGENS DE HOJE ===");
  const summary = await client.query(\`
    SELECT direction, status, count(*) as qty
    FROM "Message"
    WHERE "createdAt" >= '2026-11-09 00:00:00'
    GROUP BY direction, status;
  \`);
  console.log(JSON.stringify(summary.rows));

  await client.end();
}
run().catch(console.error);
`;

  conn.exec(`cat << 'EOF' > /root/inspect_undelivered.js\n${code}\nEOF\ncd /root/VERSUS/backend && node /root/inspect_undelivered.js`, (err, stream) => {
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
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});
