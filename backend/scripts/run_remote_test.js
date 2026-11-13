const { Client } = require('ssh2');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Fazendo upload do script de teste para a VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localFile = path.join(__dirname, 'remote_test_dispatch.js');
    const remoteFile = '/root/verus/backend/scripts/remote_test_dispatch.js';

    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) throw err;
      console.log('Upload concluído. Executando na VPS...');

      conn.exec('cd /root/verus/backend && node scripts/remote_test_dispatch.js', (err, stream) => {
        if (err) throw err;

        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
          console.log(`Processo finalizado com código ${code}`);
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

