const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const axios = require('axios');
    const fs = require('fs');
    const path = require('path');

    const prisma = new PrismaClient();
    const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

    async function run() {
      // 1. Get all contacts in CRM
      const crmContacts = await prisma.contact.findMany({
        where: { tenantId },
        select: { id: true, name: true, phone: true }
      });
      console.log('CRM Contacts count:', crmContacts.length);

      // 2. Get findStatusMessage
      const res = await axios.post('http://localhost:8080/chat/findStatusMessage/versus_fc89e34b2b_babdc262eb', {}, {
        headers: { apikey: 'verto123' }
      });
      const data = res.data;
      const now = Date.now();
      const last24h = data.filter(d => {
        const dt = d.datetime > 10000000000 ? d.datetime : d.datetime * 1000;
        return (now - dt) < 24 * 3600 * 1000 && (d.status === 'READ' || d.status === 'PLAYED');
      });

      const uniqueJids = new Map();
      for (const item of last24h) {
        if (!uniqueJids.has(item.remoteJid)) {
          uniqueJids.set(item.remoteJid, item);
        }
      }

      // 3. Load contacts via Evolution API
      const contactsRes = await axios.post('http://localhost:8080/chat/findContacts/versus_fc89e34b2b_babdc262eb', {}, {
        headers: { apikey: 'verto123' }
      });
      const evoContacts = new Map();
      if (Array.isArray(contactsRes.data)) {
        for (const c of contactsRes.data) {
          if (c.id) evoContacts.set(c.id, c);
        }
      }

      console.log('--- RECONCILING 22 UNIQUE STATUS VIEWERS ---');
      let idx = 1;
      for (const [jid, item] of uniqueJids.entries()) {
        const evoContact = evoContacts.get(jid);
        const pushName = evoContact?.pushName || '';
        
        // Try match CRM contact by pushName
        let match = null;
        if (pushName && pushName !== 'SEM NOME' && pushName !== 'Comercial Verto') {
          const cleanPush = pushName.trim().toLowerCase();
          match = crmContacts.find(c => {
            const cName = c.name.trim().toLowerCase();
            return cName === cleanPush || cName.includes(cleanPush) || cleanPush.includes(cName);
          });
        }

        const dt = new Date(item.datetime > 10000000000 ? item.datetime : item.datetime * 1000);
        console.log(\`\${idx++}. JID: \${jid} | PushName: "\${pushName}" | Matched CRM: \${match ? \`"\${match.name}" (\${match.phone})\` : 'NONE'} | Horário: \${dt.toLocaleTimeString('pt-BR')}\`);
      }
      await prisma.$disconnect();
    }
    run().catch(console.error);
  `;
  const stream = conn.exec('cd /root/verus/backend && node', (err, stream) => {
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
