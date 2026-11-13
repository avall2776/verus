const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
const http = require('http');

const testNumbers = [
  "5563984841099",
  "5542999168982",
  "5564999491700",
  "5553999303617",
  "5551998713884",
  "5598985571552",
  "5551999709142",
  "5586994542567",
  "5591981631508",
  "5596991163279",
  "5562985323212",
  "5568992299461",
  "5594992371177"
];

async function checkAll() {
  const postData = JSON.stringify({ numbers: testNumbers });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 8080,
    path: '/chat/whatsappNumbers/versus_fc89e34b2b_babdc262eb',
    method: 'POST',
    headers: {
      'apikey': 'verto123',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      const results = JSON.parse(data);
      console.log("=== COMPARAÇÃO NÚMERO ENVIADO VS JID REAL NO WHATSAPP ===");
      for (const r of results) {
        const cleanJid = r.jid ? r.jid.replace('@s.whatsapp.net', '') : 'N/A';
        const hasDiff = r.number !== cleanJid;
        console.log("Número com 9: " + r.number + " -> JID Real: " + cleanJid + (hasDiff ? " ⚠️ DIVERGÊNCIA (9º DÍGITO)" : " ✅ IGUAL"));
      }
    });
  });
  req.write(postData);
  req.end();
}
checkAll().catch(console.error);
`;

  conn.exec(`cat << 'EOF' > /root/check_all_jids.js\n${code}\nEOF\nnode /root/check_all_jids.js`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
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

