const { Client } = require('ssh2');
const conn = new Client();

const commands = [
  {
    section: '1. CHAVES SSH AUTORIZADAS E ATRIBUTOS',
    cmd: `find /home /root -name "authorized_keys" -exec echo "=== Arquivo: {} ===" \\; -exec cat {} \\;
echo "--- LS -LA /root/.ssh/ ---"
ls -la /root/.ssh/
echo "--- LSATTR /root/.ssh/authorized_keys ---"
lsattr /root/.ssh/authorized_keys 2>/dev/null || echo "lsattr not available or file missing"`
  },
  {
    section: '2. USUÁRIOS, PRIVILÉGIOS E HISTÓRICO DE LOGINS',
    cmd: `echo "--- USUÁRIOS COM SHELL ATIVO (/etc/passwd) ---"
grep -vE '/nologin|/false|/sync' /etc/passwd
echo "--- GRUPOS COM PRIVILÉGIO ADMINISTRATIVO ---"
grep -E '^sudo|^wheel|^root' /etc/group
echo "--- ÚLTIMOS 20 LOGINS (last -n 20) ---"
last -n 20
echo "--- TENTATIVAS DE LOGIN FALHAS (/var/log/auth.log ou journalctl) ---"
if [ -f /var/log/auth.log ]; then
  grep "Failed password" /var/log/auth.log 2>/dev/null | tail -n 15
else
  journalctl -u ssh -u sshd --no-pager -n 50 2>/dev/null | grep "Failed password" | tail -n 15
fi`
  },
  {
    section: '3. PERSISTÊNCIA, PROCESSOS E PORTAS EXPOSTAS',
    cmd: `echo "--- CRONJOBS ROOT ---"
crontab -l 2>/dev/null || echo "Nenhum crontab para root"
echo "--- /etc/cron.d/ ---"
ls -la /etc/cron.d/
echo "--- PM2 STATUS ---"
pm2 status
echo "--- DOCKER CONTAINERS ---"
docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
echo "--- PORTAS ESCUTANDO CONEXÕES (ss -tulpn) ---"
ss -tulpn`
  },
  {
    section: '4. FIREWALL, FAIL2BAN E CONFIGURAÇÃO SSH',
    cmd: `echo "--- UFW STATUS ---"
ufw status verbose 2>/dev/null || echo "UFW não disponível"
echo "--- FAIL2BAN STATUS SSHD ---"
fail2ban-client status sshd 2>/dev/null || fail2ban-client status 2>/dev/null || echo "Fail2ban inativo ou sem comando"
echo "--- DIRETIVAS SSHD CONFIG ---"
grep -E '^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|Port)' /etc/ssh/sshd_config 2>/dev/null
if [ -d /etc/ssh/sshd_config.d ]; then
  echo "--- SSHD_CONFIG.D ---"
  grep -E '^(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication|Port)' /etc/ssh/sshd_config.d/* 2>/dev/null || true
fi`
  }
];

conn.on('ready', async () => {
  console.log('CONECTADO COM SUCESSO AO VPS 187.127.10.166');
  for (const item of commands) {
    console.log('\\n======================================================');
    console.log(item.section);
    console.log('======================================================');
    await new Promise((resolve) => {
      conn.exec(item.cmd, (err, stream) => {
        if (err) {
          console.error('Erro ao executar:', err);
          return resolve();
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => resolve());
      });
    });
  }
  conn.end();
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

