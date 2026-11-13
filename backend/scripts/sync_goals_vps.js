const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connection ready, opening SFTP...');
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    const filesToUpload = [
      {
        local: path.join(__dirname, '../src/modules/goals/goals.service.ts'),
        remote: '/root/verus/backend/src/modules/goals/goals.service.ts',
      },
      {
        local: path.join(__dirname, '../src/modules/goals/goals.controller.ts'),
        remote: '/root/verus/backend/src/modules/goals/goals.controller.ts',
      },
      {
        local: path.join(__dirname, '../dist/src/modules/goals/goals.service.js'),
        remote: '/root/verus/backend/dist/src/modules/goals/goals.service.js',
      },
      {
        local: path.join(__dirname, '../dist/src/modules/goals/goals.controller.js'),
        remote: '/root/verus/backend/dist/src/modules/goals/goals.controller.js',
      },
    ];

    let completed = 0;
    for (const f of filesToUpload) {
      console.log(`Uploading ${f.local} -> ${f.remote}...`);
      sftp.fastPut(f.local, f.remote, (err) => {
        if (err) {
          console.error(`Error uploading ${f.remote}:`, err);
        } else {
          console.log(`Uploaded ${f.remote} successfully!`);
        }
        completed++;
        if (completed === filesToUpload.length) {
          console.log('All files uploaded! Restarting versus-engine on VPS...');
          conn.exec('pm2 restart versus-engine && pm2 status', (err, stream) => {
            if (err) {
              console.error('PM2 restart error:', err);
              conn.end();
              return;
            }
            stream.on('close', (code) => {
              console.log('PM2 restart completed with code ' + code);
              conn.end();
            }).on('data', (data) => {
              process.stdout.write(data);
            }).stderr.on('data', (data) => {
              process.stderr.write(data);
            });
          });
        }
      });
    }
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
