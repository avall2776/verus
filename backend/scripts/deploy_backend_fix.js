const os = require('os');
const path = require('path');
const fs = require('fs');
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const localWhatsappService = path.join(__dirname, '../src/modules/whatsapp/whatsapp.service.ts');
const localWebhookProcessor = path.join(__dirname, '../src/modules/queues/processors/webhook.processor.ts');

const contentWhatsapp = fs.readFileSync(localWhatsappService, 'utf8');
const contentWebhook = fs.readFileSync(localWebhookProcessor, 'utf8');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    console.log('Enviando whatsapp.service.ts...');
    const stream1 = sftp.createWriteStream('/root/verus/backend/src/modules/whatsapp/whatsapp.service.ts');
    stream1.write(contentWhatsapp);
    stream1.end(() => {
      console.log('whatsapp.service.ts enviado. Enviando webhook.processor.ts...');
      const stream2 = sftp.createWriteStream('/root/verus/backend/src/modules/queues/processors/webhook.processor.ts');
      stream2.write(contentWebhook);
      stream2.end(() => {
        console.log('Arquivos atualizados no VPS. Compilando backend...');
        conn.exec('cd /root/verus/backend && npm run build && pm2 reload versus-engine', (err, stream) => {
          if (err) throw err;
          stream.on('data', d => process.stdout.write(d));
          stream.stderr.on('data', d => process.stderr.write(d));
          stream.on('close', (code) => {
            console.log(`\nBuild & Reload concluído com código ${code}`);
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

