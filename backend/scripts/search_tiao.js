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
      const matches = evo.filter(c => {
        const n = ((c.name || '') + ' ' + (c.pushName || '')).toLowerCase();
        return n.includes('tiao') || n.includes('tião') || n.includes('sebastiao') || n.includes('sebastião');
      });
      console.log('Matches Tião na Evolution:', matches.map(m => ({ id: m.id, name: m.name, pushName: m.pushName })));

      const dbMatches = await prisma.contact.findMany({
        where: {
          tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
          OR: [
            { name: { contains: 'tiao', mode: 'insensitive' } },
            { name: { contains: 'tião', mode: 'insensitive' } },
            { name: { contains: 'sebastião', mode: 'insensitive' } },
            { name: { contains: 'sebastiao', mode: 'insensitive' } }
          ]
        },
        select: { id: true, name: true, phone: true, whatsappLid: true }
      });
      console.log('Matches Tião no DB CRM:', dbMatches);

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
