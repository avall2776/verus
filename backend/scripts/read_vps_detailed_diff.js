const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec("cd /root/verus && git diff backend/src/modules/chat/chat.service.ts backend/src/modules/whatsapp/whatsapp.service.ts backend/src/modules/queues/processors/webhook.processor.ts 'frontend/src/app/(dashboard)/inbox/page.tsx'", (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log('--- DETAILED GIT DIFF ---');
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});
