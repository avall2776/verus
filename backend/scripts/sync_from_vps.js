const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const filesToSync = [
  'backend/src/modules/chat/chat.service.ts',
  'backend/src/modules/queues/processors/webhook.processor.ts',
  'backend/src/modules/whatsapp/whatsapp.service.ts',
  'frontend/src/app/(dashboard)/inbox/page.tsx',
];

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH conectado. Abrindo SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    let completed = 0;
    filesToSync.forEach((relPath) => {
      const remotePath = `/root/verus/${relPath}`;
      const localPath = path.resolve(__dirname, '../../', relPath);

      sftp.fastGet(remotePath, localPath, (err) => {
        if (err) {
          console.error(`Erro ao baixar ${relPath}:`, err.message);
        } else {
          console.log(`✓ Sincronizado da VPS: ${relPath}`);
        }
        completed++;
        if (completed === filesToSync.length) {
          conn.end();
        }
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D',
});

