const { Client } = require('ssh2');

const scriptCode = `
const { execSync } = require('child_process');

try {
  console.log('Testando script notify_backup_whatsapp.js na VPS...');
  const out = execSync('node /root/verus/backend/scripts/notify_backup_whatsapp.js /root/backups/test.sql.gz 39M', { encoding: 'utf8' });
  console.log('Saída:', out);
} catch (e) {
  console.error('Erro:', e.message, e.stdout, e.stderr);
}
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/tmp/test_backup_notify_now.js');
    writeStream.write(scriptCode);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('node /tmp/test_backup_notify_now.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

