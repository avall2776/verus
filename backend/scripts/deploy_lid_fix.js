const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localController = path.join(__dirname, '../dist/src/modules/webhooks/webhooks.controller.js');
const localProcessor = path.join(__dirname, '../dist/src/modules/queues/processors/webhook.processor.js');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;

    console.log('1. Uploading webhooks.controller.js...');
    const remoteController = '/root/verus/backend/dist/src/modules/webhooks/webhooks.controller.js';
    const rs1 = fs.createReadStream(localController);
    const ws1 = sftp.createWriteStream(remoteController);
    rs1.pipe(ws1).on('close', () => {
      console.log('webhooks.controller.js uploaded!');

      console.log('2. Uploading webhook.processor.js...');
      const remoteProcessor = '/root/verus/backend/dist/src/modules/queues/processors/webhook.processor.js';
      const rs2 = fs.createReadStream(localProcessor);
      const ws2 = sftp.createWriteStream(remoteProcessor);
      rs2.pipe(ws2).on('close', () => {
        console.log('webhook.processor.js uploaded!');

        console.log('3. Running pm2 reload versus-engine...');
        conn.exec('pm2 reload versus-engine && sleep 2 && pm2 status', (err, stream) => {
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
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'),
});

