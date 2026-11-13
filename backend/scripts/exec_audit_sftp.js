const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Fazendo upload e executando auditoria via SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localFile = path.join(__dirname, 'run_audit.sh');
    const remoteFile = '/root/run_audit.sh';

    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) throw err;

      conn.exec('chmod +x /root/run_audit.sh && /root/run_audit.sh', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', code => {
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

