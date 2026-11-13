const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const axios = require('/root/verus/backend/node_modules/axios');
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();

    async function check() {
      const res = await axios.post('http://localhost:8080/chat/findContacts/versus_fc89e34b2b_babdc262eb', {}, {
        headers: { apikey: 'verto_token_babdc262eb' }
      });
      const evo = res.data || [];
      const searchTerms = ['anderley', 'zilber', 'cleo', 'frontsoldas', 'adelson', 'manoel', 'sandra', 'ferri', 'markinhos', 'rodrigo planta'];
      const found = [];
      for (const t of searchTerms) {
        const matches = evo.filter(c => ((c.name || '') + ' ' + (c.pushName || '')).toLowerCase().includes(t));
        found.push({ term: t, count: matches.length, matches: matches.map(m => ({ id: m.id, name: m.name, pushName: m.pushName })) });
      }
      console.log('RESULT EVOLUTION:');
      console.log(JSON.stringify(found, null, 2));

      // Check how many total contacts in DB have only numbers without name
      const noName = await prisma.contact.count({
        where: {
          tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
          OR: [
            { name: null },
            { name: '' },
            { name: '.' },
            { name: '-' },
            { name: 'Cliente WhatsApp' },
            { name: 'Cliente Verto' },
            { name: { startsWith: 'WhatsApp (' } },
            { name: { startsWith: 'Contato WhatsApp (' } }
          ]
        }
      });
      console.log('Total contatos com nomes genericos/sem nome no DB:', noName);

      // Check total contacts in DB
      const total = await prisma.contact.count({
        where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' }
      });
      console.log('Total contatos no DB:', total);

      await prisma.$disconnect();
    }
    check().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    let out = '';
    stream.on('close', () => {
      console.log(out);
      conn.end();
    }).on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});

