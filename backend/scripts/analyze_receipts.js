const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const axios = require('axios');
    const fs = require('fs');
    async function run() {
      const res = await axios.post('http://localhost:8080/chat/findStatusMessage/versus_fc89e34b2b_babdc262eb', {}, {
        headers: { apikey: 'verto123' }
      });
      const data = res.data;
      console.log('Total items in findStatusMessage:', data.length);
      const reads = data.filter(d => d.status === 'READ' || d.status === 'PLAYED');
      console.log('Total READ or PLAYED:', reads.length);
      console.log('Sample reads:', reads.slice(0, 20));

      const lids = reads.filter(r => r.remoteJid.includes('@lid'));
      const swh = reads.filter(r => r.remoteJid.includes('@s.whatsapp.net'));
      console.log('Reads with @lid:', lids.length);
      console.log('Reads with @s.whatsapp.net:', swh.length);
      
      // Let's check contacts in store
      try {
        const contactFiles = fs.readdirSync('/evolution/store/contacts/versus_fc89e34b2b_babdc262eb');
        console.log('Total contact store files:', contactFiles.length);
        // Let's inspect a few contact files
        for (const cf of contactFiles.slice(0, 10)) {
          const cData = JSON.parse(fs.readFileSync('/evolution/store/contacts/versus_fc89e34b2b_babdc262eb/' + cf, 'utf8'));
          if (cData.lid || cData.id?.includes('lid')) {
            console.log('Contact with lid found:', cData);
          }
        }
      } catch(e) {
        console.log('Store contacts read error:', e.message);
      }
    }
    run().catch(console.error);
  `;
  conn.exec(`docker exec -i evolution-api node -e "${script.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('Result:\n' + out);
      conn.end();
    }).on('data', (d) => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
