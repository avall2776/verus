const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const endpoints = [
    '/functions/v1/api-chat-handler/v1/chats',
    '/functions/v1/api-conversations-handler/v1/conversations',
    '/functions/v1/api-whatsapp-handler/v1/chats',
    '/rest/v1/chats?select=*&limit=3',
    '/rest/v1/conversations?select=*&limit=3',
    '/rest/v1/messages?select=*&limit=3'
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(LERO_API + ep, {
        headers: { 
          'Authorization': 'Bearer ' + LERO_TOKEN,
          'apikey': LERO_TOKEN
        }
      });
      console.log(ep, '-> status:', res.status);
      if (res.ok) {
        const d = await res.json();
        console.log('Sample:', JSON.stringify(d).slice(0, 200));
      }
    } catch (e) {
      console.log(ep, '-> err:', e.message);
    }
  }
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_chat_eps.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_chat_eps.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_chat_eps.js', () => conn.end());
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

