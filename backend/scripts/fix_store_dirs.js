const { Client } = require('ssh2');

const remoteScript = `
const { exec } = require('child_process');
exec('docker exec evolution-api mkdir -p /evolution/store/messages/versus_fc89e34b2b_babdc262eb /evolution/store/chats/versus_fc89e34b2b_babdc262eb /evolution/store/contacts/versus_fc89e34b2b_babdc262eb && docker exec evolution-api chmod -R 777 /evolution/store', (err, stdout, stderr) => {
  console.log('Created directories:', stdout || stderr || 'SUCCESS');
});
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const ws = sftp.createWriteStream('/tmp/fix_store.js');
    ws.write(remoteScript);
    ws.end();
    ws.on('close', () => {
      conn.exec('node /tmp/fix_store.js', (err, stream) => {
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

