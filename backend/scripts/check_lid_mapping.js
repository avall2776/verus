const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const fs = require('fs');
    const path = require('path');
    const dir = '/evolution/store/contacts/versus_fc89e34b2b_babdc262eb';
    const files = fs.readdirSync(dir);
    console.log('Total contact files:', files.length);

    let withBoth = 0;
    let sample = [];
    for (const f of files) {
      try {
        const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        if (c.lid || (c.id && c.id.includes('@lid')) || (c.id && c.id.includes('@s.whatsapp.net'))) {
          if (sample.length < 5) sample.push(c);
          if (c.lid && c.id) withBoth++;
        }
      } catch(e) {}
    }
    console.log('With both lid & id:', withBoth);
    console.log('Sample contacts:\\n', JSON.stringify(sample, null, 2));

    // Check chats
    const chatDir = '/evolution/store/chats/versus_fc89e34b2b_babdc262eb';
    if (fs.existsSync(chatDir)) {
      const chatFiles = fs.readdirSync(chatDir);
      console.log('Total chat files:', chatFiles.length);
      for (const cf of chatFiles.slice(0, 3)) {
        console.log('Chat sample:', fs.readFileSync(path.join(chatDir, cf), 'utf8'));
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
