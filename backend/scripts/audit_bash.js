const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Executando conferência via psql nativo...');

  const commands = [
    'source /root/.versus_db_credentials',
    'export SUPA_URL="postgresql://postgres.aoxajwlocxetfxthkdxa:xRR%40QZJ5g3UV%3F74@aws-0-us-east-2.pooler.supabase.com:5432/postgres"',
    'export LOCAL_URL="postgresql://versus_user:$LOCAL_DB_PASS@127.0.0.1:5432/versus_db"',
    `cat << 'EOF' > /root/run_audit.sh
#!/bin/bash
source /root/.versus_db_credentials
SUPA="postgresql://postgres.aoxajwlocxetfxthkdxa:xRR%40QZJ5g3UV%3F74@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
LOCAL="postgresql://versus_user:$LOCAL_DB_PASS@127.0.0.1:5432/versus_db"

tables=(
  "Contact"
  "Message"
  "Conversation"
  "Deal"
  "User"
  "Tenant"
  "WhatsAppInstance"
  "active_sessions"
  "login_audit_logs"
  "two_factor_verifications"
  "Contract"
  "Department"
  "Proposal"
  "QuickReply"
  "SupportTicket"
  "EngineeringItem"
  "whatsapp_status_posts"
)

printf "%-26s | %-16s | %-16s | %s\n" "TABELA" "SUPABASE OHIO" "LOCAL PG17 VPS" "INTEGRIDADE"
echo "----------------------------------------------------------------------------------"

all_ok=1
for t in "\${tables[@]}"; do
  c_supa=$(/usr/lib/postgresql/17/bin/psql "$SUPA" -t -A -c "SELECT count(*) FROM \"$t\";" 2>/dev/null || echo "0")
  c_loc=$(/usr/lib/postgresql/17/bin/psql "$LOCAL" -t -A -c "SELECT count(*) FROM \"$t\";" 2>/dev/null || echo "0")
  
  if [ "$c_supa" == "$c_loc" ]; then
    status="OK 100% IDENTICO"
  else
    status="DIVERGENCIA"
    all_ok=0
  fi
  printf "%-26s | %-16s | %-16s | %s\n" "$t" "$c_supa" "$c_loc" "$status"
done

echo "----------------------------------------------------------------------------------"
if [ $all_ok -eq 1 ]; then
  echo "SUCESSO: Auditoria concluida com 100% de paridade entre Supabase e Local VPS!"
else
  echo "AVISO: Foi detectada divergencia em alguma tabela."
fi
EOF
`,
    'chmod +x /root/run_audit.sh',
    '/root/run_audit.sh',
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

