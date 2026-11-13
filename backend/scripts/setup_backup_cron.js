const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Configurando script e rotina de backup diário (Cron)...');

  const scriptContent = `#!/bin/bash
# ==============================================================================
# VALLOR OMNICHANNEL - ROTINA DE BACKUP AUTOMÁTICO DIÁRIO DO BANCO DE DADOS
# ==============================================================================
set -e

BACKUP_DIR="/root/backups"
LOG_FILE="/var/log/versus_db_backup.log"
DATE=\$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="\$BACKUP_DIR/versus_db_\$DATE.sql.gz"

mkdir -p "\$BACKUP_DIR"

echo "[\$(date +'%Y-%m-%d %H:%M:%S')] [BACKUP_START] Iniciando snapshot do PostgreSQL 17 local..." >> "\$LOG_FILE"

source /root/.versus_db_credentials
PGPASSWORD="\$LOCAL_DB_PASS" /usr/lib/postgresql/17/bin/pg_dump -h 127.0.0.1 -p 5432 -U versus_user -d versus_db | gzip > "\$BACKUP_FILE"

FILE_SIZE=\$(ls -lh "\$BACKUP_FILE" | awk '{print \$5}')
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] [BACKUP_SUCCESS] Arquivo criado: \$BACKUP_FILE (\$FILE_SIZE)" >> "\$LOG_FILE"

# Atualiza link para o snapshot mais recente
cp "\$BACKUP_FILE" "\$BACKUP_DIR/latest_versus_db.sql.gz"

# Retenção: remove backups com mais de 7 dias
find "\$BACKUP_DIR" -type f -name "versus_db_*.sql.gz" -mtime +7 -delete
echo "[\$(date +'%Y-%m-%d %H:%M:%S')] [CLEANUP] Retenção de 7 dias aplicada com sucesso." >> "\$LOG_FILE"
`;

  const commands = [
    `cat << 'EOF' > /root/backup_versus_db.sh\n${scriptContent}\nEOF`,
    'chmod +x /root/backup_versus_db.sh',
    // Executa um primeiro backup imediato para teste
    '/root/backup_versus_db.sh',
    'ls -lh /root/backups',
    'cat /var/log/versus_db_backup.log',
    // Adiciona ao crontab para rodar todo dia às 03:00 da madrugada
    '(crontab -l 2>/dev/null | grep -v "backup_versus_db.sh" ; echo "0 3 * * * /root/backup_versus_db.sh >/dev/null 2>&1") | crontab -',
    'crontab -l',
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', code => {
      console.log(`\nConfiguração de backup concluída com código: ${code}`);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

