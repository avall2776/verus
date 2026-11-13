const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const fs = require('fs');
    const path = require('path');

    // In Baileys auth credentials, there are usually lid-mapping files or auth keys
    const authDir = '/evolution/instances/versus_fc89e34b2b_babdc262eb';
    console.log('Checking auth dir:', authDir);
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      console.log('Auth files count:', files.length);
      const lidFiles = files.filter(f => f.includes('lid') || f.includes('sync') || f.includes('contact'));
      console.log('LID/sync related files in auth:', lidFiles.slice(0, 10));
    }

    // Let's also check messages store for one of the lids, e.g. 207262371041280 (Paulo Roberto Pradebon)
    const messagesDir = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb';
    if (fs.existsSync(messagesDir)) {
      const mFiles = fs.readdirSync(messagesDir);
      console.log('Total message files:', mFiles.length);
      for (const mf of mFiles) {
        if (mf.includes('207262371041280') || mf.includes('153819992354947') || mf.includes('96843040075951')) {
          console.log('Message file match:', mf);
        }
      }
    }

    // Also check chats
    const chatDir = '/evolution/store/chats/versus_fc89e34b2b_babdc262eb';
    if (fs.existsSync(chatDir)) {
      for (const cf of fs.readdirSync(chatDir)) {
        try {
          const c = JSON.parse(fs.readFileSync(path.join(chatDir, cf), 'utf8'));
          if (c.id?.includes('153819992354947') || c.id?.includes('207262371041280')) {
            console.log('Chat match:', c);
          }
        } catch(e) {}
      }
    }
  `;
  const stream = conn.exec('docker exec -i evolution-api node', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Result:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
    stream.write(script);
    stream.end();
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
