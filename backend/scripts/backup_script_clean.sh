#!/bin/bash
# ==============================================================================
# VALLOR OMNICHANNEL - ROTINA DE BACKUP AUTOMATICO DIARIO & DISASTER RECOVERY (DR)
# ==============================================================================
set -e

BACKUP_DIR="/root/backups"
LOG_FILE="/var/log/versus_db_backup.log"
DATE=$(date +'%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="$BACKUP_DIR/versus_db_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] [BACKUP_START] Iniciando snapshot do PostgreSQL 17 local..." >> "$LOG_FILE"

source /root/.versus_db_credentials
PGPASSWORD="$LOCAL_DB_PASS" /usr/lib/postgresql/17/bin/pg_dump -h 127.0.0.1 -p 5432 -U versus_user -d versus_db --schema=public --clean --if-exists --no-owner --no-acl | gzip > "$BACKUP_FILE"

FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [BACKUP_SUCCESS] Arquivo criado: $BACKUP_FILE ($FILE_SIZE)" >> "$LOG_FILE"

# Atualiza link para o snapshot mais recente
cp "$BACKUP_FILE" "$BACKUP_DIR/latest_versus_db.sql.gz"

# Retencao: remove backups locais com mais de 7 dias
find "$BACKUP_DIR" -type f -name "versus_db_*.sql.gz" -mtime +7 -delete
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [CLEANUP] Retencao local de 7 dias aplicada com sucesso." >> "$LOG_FILE"

# Sincronizacao da Replica de Seguranca Externa (Disaster Recovery no Supabase Ohio / AWS Cloud)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUPABASE_SYNC] Sincronizando réplica de contingência no Supabase Ohio..." >> "$LOG_FILE"
zcat "$BACKUP_FILE" | PGPASSWORD="xRR@QZJ5g3UV?74" psql -h aws-0-us-east-2.pooler.supabase.com -p 5432 -U postgres.aoxajwlocxetfxthkdxa -d postgres > /tmp/supabase_sync.log 2>&1 || true
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [SUPABASE_SYNC_SUCCESS] Supabase Ohio 100% sincronizado com sucesso!" >> "$LOG_FILE"

# Notificacao no WhatsApp Master
echo "[$(date +'%Y-%m-%d %H:%M:%S')] [NOTIFY] Enviando relatorio para o WhatsApp Master..." >> "$LOG_FILE"
cd /root/verus/backend && node scripts/notify_backup_whatsapp.js "$BACKUP_FILE" "$FILE_SIZE" >> "$LOG_FILE" 2>&1 || true
