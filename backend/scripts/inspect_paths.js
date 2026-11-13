const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const fns = [
    '/functions/v1/api-chat-handler/v1/messages',
    '/functions/v1/api-chat-handler/v1/chats',
    '/functions/v1/api-chats-handler/v1/chats',
    '/functions/v1/api-funnels-handler/v1/funnels',
    '/functions/v1/api-funnels-handler/v1/funnels/cards',
    '/functions/v1/api-contacts-handler/v1/contacts',
    '/functions/v1/api-whatsapp-handler/v1/messages',
    '/functions/v1/api-whatsapp-handler/v1/chats',
    '/functions/v1/api-inbox-handler/v1/chats',
    '/functions/v1/api-inbox-handler/v1/conversations'
  ];
  for (const fn of fns) {
    try {
      const res = await fetch(LERO_API + fn + '?limit=1', {
        headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
      });
      console.log(fn, '-> status:', res.status);
      if (res.ok) {
        const d = await res.json();
        console.log('   OK data:', Object.keys(d));
      }
    } catch (e) {
      console.log(fn, '-> err:', e.message);
    }
  }
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_paths.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_paths.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_paths.js', () => conn.end());
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

