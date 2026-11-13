const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Enviando script de backup e ativando Cron...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localFile = path.join(__dirname, 'backup_script_clean.sh');
    const remoteFile = '/root/backup_versus_db.sh';

    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) throw err;

      const commands = [
        'chmod +x /root/backup_versus_db.sh',
        // Executa um teste imediato
        '/root/backup_versus_db.sh',
        'ls -lh /root/backups',
        'tail -n 10 /var/log/versus_db_backup.log',
        // Agenda no Crontab para rodar todo dia às 03:00 AM
        '(crontab -l 2>/dev/null | grep -v "backup_versus_db.sh" ; echo "0 3 * * * /root/backup_versus_db.sh >/dev/null 2>&1") | crontab -',
        'echo "--- CRONTAB ATUALIZADO ---"',
        'crontab -l',
      ].join(' && ');

      conn.exec(commands, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', code => {
          console.log(`Rotina de backup ativada com código: ${code}`);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'),
});

