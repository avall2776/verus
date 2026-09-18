#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE HARDENING & SEGURANÇA VOIP PARA A VPS VERSUS (187.127.10.166)
# ==============================================================================
# Executa as 3 recomendações do relatório de auditoria técnica:
# 1. Criação de Swapfile de 4 GB para prevenir OOM Killer em picos de RTP
# 2. Configuração de regras de firewall (UFW) para portas SIP, WSS e RTP
# 3. Instalação e ativação do Fail2ban para bloqueio de scanners maliciosos
# ==============================================================================

set -e

echo "=========================================================="
echo " [1/4] CONFIGURANDO SWAPFILE DE 4 GB..."
echo "=========================================================="

if [ -f /swapfile ]; then
    echo "Swapfile /swapfile já existe. Verificando status..."
    free -h
else
    echo "Alocando 4 GB em /swapfile..."
    fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    # Persistir no fstab se não estiver presente
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
    fi

    # Ajustar swappiness para 10 (ideal para servidores de áudio em tempo real)
    sysctl vm.swappiness=10
    if ! grep -q "vm.swappiness=10" /etc/sysctl.conf; then
        echo "vm.swappiness=10" >> /etc/sysctl.conf
    fi
    echo "Swapfile ativado com sucesso!"
    free -h
fi

echo ""
echo "=========================================================="
echo " [2/4] CONFIGURANDO REGRAS DE FIREWALL PARA VOIP/SIP & WEBRTC..."
echo "=========================================================="

# Instalar UFW se necessário
apt-get update -y
apt-get install -y ufw

# Regras essenciais do VERSUS
ufw default deny incoming
ufw default allow outgoing

# Portas de infraestrutura básica
ufw allow 22/tcp comment "SSH Server"
ufw allow 3001/tcp comment "VERSUS Backend Engine"
ufw allow 8080/tcp comment "Docker Proxy"
ufw allow 5678/tcp comment "Docker Workflow"

# Portas essenciais de Telefonia VoIP & WebRTC
ufw allow 5060/udp comment "SIP Signaling UDP"
ufw allow 5060/tcp comment "SIP Signaling TCP"
ufw allow 5061/tcp comment "SIP Signaling TLS"
ufw allow 7443/tcp comment "WebRTC SIP WSS Gateway"
ufw allow 8089/tcp comment "Asterisk ARI / WebSocket"
ufw allow 10000:20000/udp comment "RTP Audio Media Streams"

# Ativar UFW sem desconectar o SSH
echo "y" | ufw enable
ufw status verbose

echo ""
echo "=========================================================="
echo " [3/4] INSTALANDO E CONFIGURANDO FAIL2BAN (ANTI-SCANNER SIP)..."
echo "=========================================================="

apt-get install -y fail2ban

cat << 'EOF' > /etc/fail2ban/jail.d/voip-security.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
maxretry = 4

[asterisk]
enabled = true
port = 5060,5061
protocol = all
maxretry = 3
action = %(action_mwl)s
logpath = /var/log/asterisk/messages
EOF

systemctl restart fail2ban
systemctl enable fail2ban
fail2ban-client status

echo ""
echo "=========================================================="
echo " [4/4] RESUMO DE SEGURANÇA E RECURSOS"
echo "=========================================================="
uptime
free -h
ufw status numbered
echo ""
echo "✓ Hardening da VPS concluído com sucesso para operação VoIP!"
