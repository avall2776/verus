const { Client } = require('ssh2');
const fs = require('fs');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function test() {
  const candidates = [
    '/functions/v1/api-chat-handler/v1/chats',
    '/functions/v1/api-chat-handler/v1/conversations',
    '/functions/v1/api-chat-handler/v1/messages',
    '/functions/v1/api-conversations-handler/v1/conversations',
    '/functions/v1/api-whatsapp-handler/v1/chats',
    '/functions/v1/api-whatsapp-handler/v1/messages',
    '/functions/v1/api-funnels-handler/v1/funnels/cards',
    '/rest/v1/conversations',
    '/rest/v1/messages',
    '/rest/v1/chats',
    '/rest/v1/contacts'
  ];

  for (const endpoint of candidates) {
    try {
      const res = await fetch(LERO_API + endpoint + '?limit=2', {
        headers: { 
          'Authorization': 'Bearer ' + LERO_TOKEN,
          'apikey': LERO_TOKEN
        }
      });
      console.log(endpoint, '-> status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Sample data:', JSON.stringify(data).slice(0, 150));
      }
    } catch (e) {
      console.log(endpoint, '-> error:', e.message);
    }
  }
}
test();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_lero.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_lero.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_lero.js', () => conn.end());
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
