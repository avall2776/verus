const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');

// 1. Procura na pasta store de mensagens
const dir = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb';
const files = fs.readdirSync(dir);
console.log('Total files in store:', files.length);

const statusPosts = [];
for (const file of files) {
  try {
    const full = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(full, 'utf8'));
    const remoteJid = content.key?.remoteJid || '';
    if (remoteJid === 'status@broadcast') {
      statusPosts.push({
        file,
        key: content.key,
        messageType: content.messageType,
        messageTimestamp: content.messageTimestamp,
        date: new Date((content.messageTimestamp || 0) * 1000).toISOString(),
        caption: content.message?.imageMessage?.caption || content.message?.videoMessage?.caption || content.message?.conversation,
        hasImage: Boolean(content.message?.imageMessage),
        hasVideo: Boolean(content.message?.videoMessage),
        mimetype: content.message?.imageMessage?.mimetype || content.message?.videoMessage?.mimetype,
        url: content.message?.imageMessage?.url,
        jpegThumbnail: Boolean(content.message?.imageMessage?.jpegThumbnail || content.message?.videoMessage?.jpegThumbnail)
      });
    }
  } catch (e) {}
}

console.log('Status posts com remoteJid === status@broadcast:', statusPosts.length);
console.log(JSON.stringify(statusPosts, null, 2));
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
