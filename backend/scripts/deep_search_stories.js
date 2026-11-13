const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const fs = require('fs');
const path = require('path');
const dir = '/evolution/store/messages/versus_fc89e34b2b_babdc262eb';
const files = fs.readdirSync(dir);
console.log('Total store files:', files.length);

const results = [];
for (const file of files) {
  try {
    const full = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(full, 'utf8'));
    
    // Check if it is a status broadcast OR fromMe OR participant is the instance phone
    const remoteJid = content.key?.remoteJid || content.remoteJid || '';
    const participant = content.key?.participant || content.participant || '';
    const fromMe = content.key?.fromMe;
    const ts = content.messageTimestamp?.low || content.messageTimestamp || 0;
    
    const isStatus = remoteJid.includes('status@broadcast');
    const isOurPhone = participant.includes('99112550') || participant.includes('9112550');
    
    if (isStatus || isOurPhone || (fromMe && isStatus)) {
      results.push({
        file,
        id: content.key?.id,
        remoteJid,
        fromMe,
        participant,
        ts,
        dateISO: ts ? new Date(ts * 1000).toISOString() : null,
        dateBrasilia: ts ? new Date(ts * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null,
        messageType: content.messageType || Object.keys(content.message || {})[0],
        caption: content.message?.imageMessage?.caption || content.message?.extendedTextMessage?.text || content.message?.conversation || content.message?.videoMessage?.caption,
        hasThumb: !!(content.message?.imageMessage?.jpegThumbnail || content.message?.videoMessage?.jpegThumbnail),
        receiptCount: content.userReceipt ? content.userReceipt.length : 0,
        receipts: (content.userReceipt || []).slice(0, 5)
      });
    }
  } catch (e) {}
}

console.log('--- FOUND MATCHING MESSAGES: ' + results.length + ' ---');
results.sort((a, b) => (b.ts || 0) - (a.ts || 0));

console.log('=== STORIES WITH fromMe === true OR participant is our phone ===');
const own = results.filter(r => r.fromMe || r.participant?.includes('99112550') || r.participant?.includes('9112550'));
console.log(JSON.stringify(own, null, 2));

console.log('=== ALL STATUSES POSTED TODAY BETWEEN 06:00 AND 14:00 BRASILIA ===');
const morning = results.filter(r => {
  if (!r.dateBrasilia) return false;
  return r.dateBrasilia.includes('27/10/2026') || r.dateBrasilia.includes('26/10/2026');
});
console.log(JSON.stringify(morning.slice(0, 20), null, 2));
`;

  conn.exec(`docker exec -i evolution-api node -e "${nodeScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('OUTPUT:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
