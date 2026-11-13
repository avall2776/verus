const { Client } = require('ssh2');

const remoteScript = `
const { exec } = require('child_process');
exec('docker logs evolution-api 2>&1 | grep -A 10 -B 5 "3EB0440B467E3FBE6A8984" | tail -n 50', (err, stdout, stderr) => {
  console.log('OUTPUT:', stdout || 'NADA ENCONTRADO');
});
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_felipe_msg.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_felipe_msg.js', (err, stream) => {
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

