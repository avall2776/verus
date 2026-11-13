const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const remoteScript = `
    const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
    const axios = require('/root/verus/backend/node_modules/axios');
    const prisma = new PrismaClient();

    function normalizeContactName(s) {
      if (!s) return '';
      return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
    }

    async function test() {
      const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
      const targetInstanceName = 'versus_fc89e34b2b_babdc262eb';
      const apiKey = 'verto_token_babdc262eb';

      console.log('Buscando contatos na Evolution API...');
      const res = await axios.post('http://localhost:8080/chat/findContacts/' + targetInstanceName, {}, {
        headers: { apikey: apiKey, 'Content-Type': 'application/json' },
        timeout: 25000
      });
      const contacts = res.data || [];
      console.log('Total contatos Evolution:', contacts.length);

      const nameToContactMap = new Map();
      for (const ec of contacts) {
        if (!ec.id || ec.id.includes('@lid')) continue;
        const realPhone = ec.id.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\\D/g, '');
        if (realPhone.length < 10 || realPhone.length > 13) continue;

        const candidateName = ec.pushName || ec.name;
        const norm = normalizeContactName(candidateName);
        if (norm && norm.length >= 3) {
          nameToContactMap.set(norm, {
            realPhone,
            name: candidateName,
            avatarUrl: ec.profilePictureUrl || null
          });
        }
      }

      console.log('Total entradas no mapa de nomes:', nameToContactMap.size);

      // Busca os contatos com LID
      const lidContacts = await prisma.contact.findMany({
        where: {
          tenantId,
          OR: [
            { phone: { contains: 'lid' } },
            { phone: { startsWith: '17' } },
            { phone: { startsWith: '69' } },
            { name: { contains: 'Marlon' } },
            { name: { contains: 'Lucas' } },
            { name: { contains: 'Prestes' } },
            { name: { contains: 'renan' } }
          ]
        },
        select: { id: true, name: true, phone: true, whatsappLid: true }
      });

      console.log('\\n--- TESTANDO RESOLUCAO PARA CADA CONTATO LID ---');
      for (const contact of lidContacts) {
        console.log('\\nAnalisando:', contact.name, '| Phone:', contact.phone, '| LID:', contact.whatsappLid);
        const inNormName = normalizeContactName(contact.name);
        console.log('Nome normalizado:', inNormName);

        // 1. Exato
        let match = nameToContactMap.get(inNormName);
        if (match) {
          console.log('-> Match EXATO na Agenda:', match);
        } else {
          // 2. Prefixo
          if (inNormName.split(' ').length >= 2 && inNormName.length >= 6) {
            for (const [candNorm, candData] of nameToContactMap.entries()) {
              if (candNorm.startsWith(inNormName + ' ') || inNormName.startsWith(candNorm + ' ')) {
                match = candData;
                console.log('-> Match PREFIXO na Agenda com [' + candNorm + ']:', match);
                break;
              }
            }
          }
        }

        if (!match) {
          console.log('-> Nao encontrado na Agenda. Testando no CRM...');
          const crmCandidates = await prisma.contact.findMany({
            where: {
              tenantId,
              phone: { not: null },
              NOT: { phone: { contains: 'lid' } },
              id: { not: contact.id }
            },
            select: { id: true, name: true, phone: true }
          });

          for (const rc of crmCandidates) {
            const rcNorm = normalizeContactName(rc.name);
            if (rcNorm === inNormName || (inNormName.split(' ').length >= 2 && (rcNorm.startsWith(inNormName + ' ') || inNormName.startsWith(rcNorm + ' ')))) {
              console.log('-> Match no CRM com [' + rc.name + '] (' + rc.phone + ')');
              match = { realPhone: rc.phone, name: rc.name };
              break;
            }
          }
        }

        if (!match) {
          console.log('-> INCONCLUSIVO: Contato nao possui correspondente com telefone real.');
        }
      }

      await prisma.$disconnect();
    }
    test().catch(console.error);
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
