const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const fns = [
    '/functions/v1/api-chat-handler',
    '/functions/v1/api-chats-handler',
    '/functions/v1/api-messages-handler',
    '/functions/v1/api-whatsapp-handler',
    '/functions/v1/api-contacts-handler',
    '/functions/v1/api-funnels-handler',
    '/functions/v1/chat-handler',
    '/functions/v1/chats',
    '/functions/v1/conversations',
    '/functions/v1/api-evolution-handler'
  ];
  for (const fn of fns) {
    try {
      const res = await fetch(LERO_API + fn, {
        headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
      });
      console.log(fn, '-> status:', res.status);
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
    const writeStream = sftp.createWriteStream('/root/test_fns.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_fns.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_fns.js', () => conn.end());
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

