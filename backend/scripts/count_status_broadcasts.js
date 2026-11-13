const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');

const dir = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb';
const files = fs.readdirSync(dir);

let totalStatus = 0;
let fromMeStatus = 0;
let fromOthersStatus = 0;
const samplesFromMe = [];
const samplesOthers = [];

for (const file of files) {
  try {
    const full = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (content.key?.remoteJid === 'status@broadcast') {
      totalStatus++;
      if (content.key?.fromMe) {
        fromMeStatus++;
        samplesFromMe.push({
          file,
          id: content.key?.id,
          fromMe: content.key?.fromMe,
          timestamp: content.messageTimestamp,
          date: new Date((content.messageTimestamp || 0) * 1000).toISOString(),
          participant: content.participant || content.key?.participant,
          userReceipt: content.userReceipt?.length || 0,
          caption: content.message?.imageMessage?.caption || content.message?.conversation
        });
      } else {
        fromOthersStatus++;
        if (samplesOthers.length < 3) {
          samplesOthers.push({
            file,
            id: content.key?.id,
            fromMe: content.key?.fromMe,
            timestamp: content.messageTimestamp,
            date: new Date((content.messageTimestamp || 0) * 1000).toISOString(),
            participant: content.participant || content.key?.participant,
            caption: content.message?.imageMessage?.caption || content.message?.conversation
          });
        }
      }
    }
  } catch (e) {}
}

console.log('Total status@broadcast messages:', totalStatus);
console.log('fromMe status:', fromMeStatus);
console.log('fromOthers status:', fromOthersStatus);
console.log('Samples fromMe:', JSON.stringify(samplesFromMe, null, 2));
console.log('Samples others:', JSON.stringify(samplesOthers, null, 2));
`;

  conn.exec(`docker exec -i evolution-api node -e "${nodeScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
