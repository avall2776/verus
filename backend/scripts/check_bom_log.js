const { Client } = require('ssh2');

const remoteScript = `
const { exec } = require('child_process');
exec('docker logs evolution-api 2>&1 | grep -A 5 -B 5 "3EB03851999EB9E02D3663"', (err, stdout, stderr) => {
  console.log(stdout || stderr || 'NENHUM LOG DE ERRO');
});
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/check_bom.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/check_bom.js', (err, stream) => {
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

