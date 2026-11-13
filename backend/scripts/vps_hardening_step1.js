const { Client } = require('ssh2');
const conn = new Client();

const script = `
set -e

echo "=== 1. ATUALIZANDO PACOTES E INSTALANDO FAIL2BAN E UFW ==="
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban ufw

echo "=== 2. CONFIGURANDO JAIL SSHD DO FAIL2BAN ==="
cat << 'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 4

[sshd]
enabled  = true
port     = 22
maxretry = 4
EOF

systemctl restart fail2ban
systemctl enable fail2ban
sleep 2

echo "=== 3. CONFIGURANDO FIREWALL UFW ==="
# Garante as portas antes de ativar
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH Access'
ufw allow 80/tcp comment 'HTTP Web'
ufw allow 443/tcp comment 'HTTPS Web SSL'
ufw allow 3001/tcp comment 'VERSUS Backend API & WebSockets'
ufw allow 8080/tcp comment 'Evolution API'

echo "Ativando UFW..."
ufw --force enable

echo "=== 4. STATUS DO FIREWALL UFW ==="
ufw status verbose

echo "=== 5. STATUS DO FAIL2BAN (SSHD JAIL) ==="
fail2ban-client status sshd

echo "=== 6. CONFERÊNCIA DOS SERVIÇOS (VERSUS & EVOLUTION) ==="
pm2 status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "=== HARDENING ETAPA 1 CONCLUÍDO COM SUCESSO ==="
`;

conn.on('ready', () => {
  console.log('Conectado à VPS. Executando Hardening Etapa 1...');
  conn.exec(script, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', (code) => {
      console.log('Script finalizado com código:', code);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

