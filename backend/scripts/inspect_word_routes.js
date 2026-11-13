const { Client } = require('ssh2');

const scriptContent = `
const LERO_TOKEN = 't0MFpI8Ft-TVyThUIkZKTAp-MnYW7sZduvkCWaib9r0AiFghvobo-xlSgOIhOzO1';
const LERO_API = 'https://api.lero.pro';

async function run() {
  const words = ['chat', 'chats', 'attendance', 'attendances', 'tickets', 'inbox', 'messages', 'conversations', 'whatsapp', 'channels'];
  for (const w of words) {
    for (const prefix of ['api-', '']) {
      const ep = '/functions/v1/' + prefix + w + '-handler/v1/' + w;
      try {
        const res = await fetch(LERO_API + ep + '?limit=1', {
          headers: { 'Authorization': 'Bearer ' + LERO_TOKEN }
        });
        if (res.status !== 404) {
          console.log('FOUND:', ep, '-> status:', res.status);
          if (res.ok) {
            const d = await res.json();
            console.log('   Data:', JSON.stringify(d).slice(0, 150));
          }
        }
      } catch (e) {}
    }
  }
}
run();
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/test_word_routes.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('node /root/test_word_routes.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('rm -f /root/test_word_routes.js', () => conn.end());
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

