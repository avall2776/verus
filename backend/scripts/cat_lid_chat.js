const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('docker exec evolution-api cat /evolution/store/chats/versus_fc89e34b2b_babdc262eb/215847943540795@lid.json', (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
