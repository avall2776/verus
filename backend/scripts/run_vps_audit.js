const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Fazendo upload e executando script de auditoria na VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localFile = path.join(__dirname, 'audit_runner_vps.js');
    const remoteFile = '/root/verus/backend/scripts/audit_runner_vps.js';

    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) throw err;
      console.log('Upload concluído. Executando auditoria...');

      conn.exec('cd /root/verus/backend && node scripts/audit_runner_vps.js', (err, stream) => {
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

