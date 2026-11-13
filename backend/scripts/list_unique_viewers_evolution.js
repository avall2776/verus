const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');

    async function run() {
      const res = await axios.post('http://localhost:8080/chat/findStatusMessage/versus_fc89e34b2b_babdc262eb', {}, {
        headers: { apikey: 'verto123' }
      });
      const data = res.data;
      const now = Date.now();
      const last24h = data.filter(d => {
        const dt = d.datetime > 10000000000 ? d.datetime : d.datetime * 1000;
        return (now - dt) < 24 * 3600 * 1000 && (d.status === 'READ' || d.status === 'PLAYED');
      });

      console.log('Total reads in last 24h:', last24h.length);

      // Unique remoteJids
      const uniqueJids = new Map();
      for (const item of last24h) {
        if (!uniqueJids.has(item.remoteJid)) {
          uniqueJids.set(item.remoteJid, item);
        }
      }

      console.log('Total UNIQUE people who read status in last 24h:', uniqueJids.size);

      // Now load contacts store to see their pushNames
      const dir = '/evolution/store/contacts/versus_fc89e34b2b_babdc262eb';
      const contactsMap = new Map();
      if (fs.existsSync(dir)) {
        for (const file of fs.readdirSync(dir)) {
          try {
            const c = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
            if (c.id) contactsMap.set(c.id, c);
          } catch(e) {}
        }
      }

      console.log('Total contacts loaded from store:', contactsMap.size);

      let idx = 1;
      for (const [jid, item] of uniqueJids.entries()) {
        const c = contactsMap.get(jid);
        const dt = new Date(item.datetime > 10000000000 ? item.datetime : item.datetime * 1000);
        console.log(\`\${idx++}. JID: \${jid} | PushName: \${c?.pushName || 'SEM NOME'} | Status: \${item.status} | Horario: \${dt.toLocaleTimeString('pt-BR')} | HasPic: \${!!c?.profilePictureUrl}\`);
      }
    }
    run().catch(console.error);
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
