const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const localNotifyScript = path.join(__dirname, 'notify_backup_whatsapp.js');
const localBackupScript = path.join(__dirname, 'backup_script_clean.sh');

conn.on('ready', () => {
  console.log('SSH conectado. Iniciando SFTP para upload dos scripts de backup e notificacao...');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('Erro SFTP:', err);
      conn.end();
      return;
    }

    // 1. Upload notify_backup_whatsapp.js
    const remoteNotify = '/root/verus/backend/scripts/notify_backup_whatsapp.js';
    const remoteBackup = '/root/backup_versus_db.sh';

    console.log(`Enviando ${localNotifyScript} -> ${remoteNotify}...`);
    sftp.fastPut(localNotifyScript, remoteNotify, (err1) => {
      if (err1) {
        console.error('Erro upload notify script:', err1);
        conn.end();
        return;
      }
      console.log('notify_backup_whatsapp.js enviado com sucesso.');

      // 2. Upload backup_versus_db.sh
      console.log(`Enviando ${localBackupScript} -> ${remoteBackup}...`);
      sftp.fastPut(localBackupScript, remoteBackup, (err2) => {
        if (err2) {
          console.error('Erro upload backup script:', err2);
          conn.end();
          return;
        }
        console.log('backup_versus_db.sh enviado com sucesso.');

        // 3. Torna executavel e roda o backup_versus_db.sh para testar em tempo real
        const cmd = 'chmod +x /root/backup_versus_db.sh && /root/backup_versus_db.sh && tail -n 25 /var/log/versus_db_backup.log';
        console.log(`Executando comando na VPS: ${cmd}...`);

        conn.exec(cmd, (err3, stream) => {
          if (err3) {
            console.error('Erro exec:', err3);
            conn.end();
            return;
          }

          stream.on('data', (d) => process.stdout.write(d.toString()));
          stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
          stream.on('close', (code) => {
            console.log(`\nProcesso finalizado com codigo de saida: ${code}`);
            conn.end();
          });
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

