const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const filesToUpload = [
  {
    local: path.join(__dirname, '..', 'dist', 'src', 'modules', 'queues', 'processors', 'webhook.processor.js'),
    remote: '/root/verus/backend/dist/src/modules/queues/processors/webhook.processor.js'
  },
  {
    local: path.join(__dirname, '..', 'dist', 'src', 'modules', 'whatsapp', 'whatsapp.service.js'),
    remote: '/root/verus/backend/dist/src/modules/whatsapp/whatsapp.service.js'
  },
  {
    local: path.join(__dirname, '..', 'dist', 'src', 'modules', 'chat', 'chat.service.js'),
    remote: '/root/verus/backend/dist/src/modules/chat/chat.service.js'
  },
  {
    local: path.join(__dirname, '..', 'dist', 'src', 'modules', 'chat', 'chat.controller.js'),
    remote: '/root/verus/backend/dist/src/modules/chat/chat.controller.js'
  },
  {
    local: path.join(__dirname, '..', 'dist', 'src', 'modules', 'chat', 'chat-alias.controller.js'),
    remote: '/root/verus/backend/dist/src/modules/chat/chat-alias.controller.js'
  }
];

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    let count = 0;
    filesToUpload.forEach(f => {
      sftp.fastPut(f.local, f.remote, (err) => {
        if (err) console.error(`Error uploading ${f.remote}:`, err);
        else console.log(`Uploaded ${f.remote}`);
        count++;
        if (count === filesToUpload.length) {
          console.log('Restarting pm2 versus-engine on VPS...');
          conn.exec('pm2 restart versus-engine', (err, proc) => {
            if (err) console.error('Error restarting pm2:', err);
            proc.on('close', () => {
              console.log('pm2 versus-engine restarted successfully!');
              conn.end();
            })
            .on('data', d => process.stdout.write(d))
            .stderr.on('data', d => process.stderr.write(d));
          });
        }
      });
    });
  });
}).connect({ host: '187.127.10.166', port: 22, username: 'root', privateKey: fs.readFileSync(path.join(os.homedir(), '.ssh', 'id_ed25519'), 'utf8'), });
