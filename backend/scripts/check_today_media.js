const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');

const dir = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb';
const files = fs.readdirSync(dir);
const now = Date.now();
const mediaList = [];

for (const file of files) {
  try {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    // Modified in last 12 hours
    if (now - stat.mtimeMs < 12 * 3600 * 1000) {
      const data = JSON.parse(fs.readFileSync(full, 'utf8'));
      if (data.message?.imageMessage || data.message?.videoMessage) {
        mediaList.push({
          file,
          mtime: stat.mtime,
          fromMe: Boolean(data.key?.fromMe),
          remoteJid: data.key?.remoteJid,
          caption: data.message?.imageMessage?.caption || data.message?.videoMessage?.caption,
          type: data.messageType,
          hasThumbnail: Boolean(data.message?.imageMessage?.jpegThumbnail || data.message?.videoMessage?.jpegThumbnail)
        });
      }
    }
  } catch (e) {}
}

console.log('Total media messages in last 12h:', mediaList.length);
console.log(JSON.stringify(mediaList, null, 2));
`;

  const remoteCmd = `docker exec -i evolution-api node << 'EOF'
${nodeScript}
EOF
`;

  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
