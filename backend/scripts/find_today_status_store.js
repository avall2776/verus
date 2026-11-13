const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');
const dir = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb';
const files = fs.readdirSync(dir);
const todayStatus = [];

for (const file of files) {
  try {
    const full = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (content.key?.remoteJid === 'status@broadcast') {
      const ts = content.messageTimestamp?.low || content.messageTimestamp;
      // Filter for last 24h: ~1793040000+
      if (ts && ts > 1793040000) {
        todayStatus.push({
          id: content.key?.id,
          fromMe: content.key?.fromMe,
          participant: content.key?.participant || content.participant,
          ts,
          time: new Date(ts * 1000).toISOString(),
          type: content.messageType || Object.keys(content.message || {})[0],
          caption: content.message?.imageMessage?.caption || content.message?.extendedTextMessage?.text || content.message?.conversation || (content.message?.videoMessage?.caption),
          hasThumb: !!(content.message?.imageMessage?.jpegThumbnail || content.message?.videoMessage?.jpegThumbnail),
          userReceiptCount: content.userReceipt ? content.userReceipt.length : 0,
          userReceipts: content.userReceipt || []
        });
      }
    }
  } catch (e) {}
}

console.log('STATUS IN LAST 24H COUNT:', todayStatus.length);
console.log('OWN STATUS (fromMe === true):', todayStatus.filter(s => s.fromMe));
console.log('ALL STATUS SUMMARY:', todayStatus.slice(0, 15));
`;

  conn.exec(`docker exec -i evolution-api node -e "${nodeScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('RESULT:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
