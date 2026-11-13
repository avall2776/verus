const { Client } = require('ssh2');

const remoteScript = `
const { exec } = require('child_process');
exec('docker exec evolution-api sed -n "905,955p" /evolution/dist/src/api/services/channels/whatsapp.baileys.service.js && echo "=== INSERT ===" && docker exec evolution-api grep -n -C 5 "repository.message.insert" /evolution/dist/src/api/services/channels/whatsapp.baileys.service.js', (err, stdout, stderr) => {
  console.log(stdout || stderr);
});
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_insert_msg.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_insert_msg.js', (err, stream) => {
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

