const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
    -- 1. Usuários que logaram hoje
    SELECT u.name, u.email, a."createdAt", a."ipAddress", a."userAgent"
    FROM "LoginAuditLog" a
    JOIN "User" u ON a."userId" = u.id
    WHERE a."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      AND a."createdAt" >= CURRENT_DATE
    ORDER BY a."createdAt" DESC;

    -- 2. Mensagens enviadas e recebidas hoje no tenant Verto
    SELECT 
      m."senderType",
      count(*) as total_msgs,
      min(m."createdAt") as first_msg,
      max(m."createdAt") as last_msg
    FROM "Message" m
    WHERE m."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      AND m."createdAt" >= CURRENT_DATE
    GROUP BY m."senderType";

    -- 3. Mensagens por atendente hoje
    SELECT 
      u.name,
      count(m.id) as msgs_enviadas
    FROM "Message" m
    JOIN "User" u ON m."userId" = u.id
    WHERE m."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      AND m."createdAt" >= CURRENT_DATE
      AND m."senderType" = 'user'
    GROUP BY u.name;

    -- 4. Conversas ativas com movimentação hoje
    SELECT 
      c.status,
      count(*)
    FROM "Conversation" c
    WHERE c."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      AND c."updatedAt" >= CURRENT_DATE
    GROUP BY c.status;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/audit_today_verto.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/audit_today_verto.sql', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log('Today Audit Report:\n', out);
          conn.end();
        });
      });
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

