const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const sql = `
    SELECT u.name, u.email, l.ip_address, l.created_at, l.user_agent
    FROM login_audit_logs l
    JOIN "User" u ON l.user_id = u.id
    WHERE l.tenant_id = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      AND l.created_at >= CURRENT_DATE
    ORDER BY l.created_at DESC;

    -- Atendentes e conversas atualizadas hoje
    SELECT 
      COALESCE(u.name, 'Sem atendente (Fila)') as atendente,
      count(c.id) as conversas_ativas_hoje,
      max(c."updatedAt") as ultima_interacao
    FROM "Conversation" c
    LEFT JOIN "User" u ON c."assignedTo" = u.id
    WHERE c."tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
      AND c."updatedAt" >= CURRENT_DATE
    GROUP BY u.name
    ORDER BY conversas_ativas_hoje DESC;
  `;

  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/tmp/audit_activity.sql');
    stream.write(sql);
    stream.end();
    stream.on('close', () => {
      conn.exec('sudo -u postgres psql -d versus_db -f /tmp/audit_activity.sql', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log('Activity Output:\n', out);
          conn.end();
        });
      });
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', password: 'g@nY;+OWkSdi5.3D' });

