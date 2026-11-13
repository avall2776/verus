const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');

const dir = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb';
const files = fs.readdirSync(dir);
console.log('Total files in store:', files.length);

for (const file of files) {
  try {
    const full = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (content.key?.remoteJid === 'status@broadcast') {
      console.log('--- FOUND STATUS MESSAGE ---');
      console.log('ID:', content.key?.id);
      console.log('fromMe:', content.key?.fromMe);
      console.log('participant:', content.key?.participant || content.participant);
      console.log('Timestamp:', content.messageTimestamp, new Date((content.messageTimestamp || 0) * 1000).toISOString());
      console.log('Caption:', content.message?.imageMessage?.caption || content.message?.conversation);
      console.log('userReceipt count:', content.userReceipt ? content.userReceipt.length : 0);
    }
  } catch (e) {}
}
`;
  conn.exec(`docker exec -i evolution-api node -e "${nodeScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Output:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
