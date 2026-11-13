const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const axios = require('/root/verus/backend/node_modules/axios');
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const prisma = new PrismaClient();

    async function check() {
      const apiKey = 'verto_token_babdc262eb';
      const instance = 'versus_fc89e34b2b_babdc262eb';
      const url = 'http://localhost:8080/chat/findContacts/' + instance;

      console.log('Buscando contatos na Evolution API...');
      const res = await axios.post(url, {}, { headers: { apikey: apiKey } });
      const evo = res.data || [];
      console.log('Total contatos Evolution:', evo.length);

      const targets = [
        'lucas silva',
        'antonio malvestitti',
        'prestes',
        'luciano santo',
        'renan forte',
        'marcio guirado',
        'marlon'
      ];

      for (const t of targets) {
        console.log('\\n=== BUSCANDO NA EVOLUTION: ' + t + ' ===');
        const matches = evo.filter(c => {
          const name = ((c.name || '') + ' ' + (c.pushName || '') + ' ' + (c.verifiedName || '')).toLowerCase();
          return name.includes(t);
        });
        console.log('Encontrados na Evolution:', matches.map(m => ({ id: m.id, name: m.name, pushName: m.pushName })));

        console.log('=== BUSCANDO NO BANCO CRM: ' + t + ' ===');
        const dbMatches = await prisma.contact.findMany({
          where: {
            tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
            name: { contains: t, mode: 'insensitive' }
          },
          select: { id: true, name: true, phone: true, whatsappLid: true }
        });
        console.log('Encontrados no DB CRM:', dbMatches);
      }

      await prisma.$disconnect();
    }
    check().catch(console.error);
  `;

  conn.exec(`node -e "${remoteScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`, (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', () => {
      console.log('OUTPUT:\n' + out);
      conn.end();
    }).on('data', d => out += d).stderr.on('data', d => out += d);
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
