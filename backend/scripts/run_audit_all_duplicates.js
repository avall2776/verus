const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditAllDuplicates() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    include: {
      conversations: {
        include: {
          messages: { select: { id: true } }
        }
      }
    }
  });

  console.log('Total de contatos no tenant:', contacts.length);

  // Agrupa por normalized phone (removendo 9º dígito do BR)
  const phoneMap = new Map();
  for (const c of contacts) {
    if (!c.phone) continue;
    let clean = c.phone.replace(/\\D/g, '');
    if (clean.startsWith('55') && clean.length === 13) {
      clean = clean.slice(0, 4) + clean.slice(5); // sem 9
    }
    if (clean.length >= 8) {
      if (!phoneMap.has(clean)) phoneMap.set(clean, []);
      phoneMap.get(clean).push(c);
    }
  }

  const dupPhones = [];
  for (const [k, list] of phoneMap.entries()) {
    if (list.length > 1) {
      dupPhones.push({
        normalized: k,
        contacts: list.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          lid: c.whatsappLid,
          source: c.source,
          convs: c.conversations.length,
          msgs: c.conversations.reduce((sum, cv) => sum + cv.messages.length, 0)
        }))
      });
    }
  }

  console.log('Duplicidades por telefone (8/9 dígitos):', dupPhones.length);
  console.log(JSON.stringify(dupPhones, null, 2));

  // Agrupa por whatsappLid
  const lidMap = new Map();
  for (const c of contacts) {
    if (!c.whatsappLid) continue;
    if (!lidMap.has(c.whatsappLid)) lidMap.set(c.whatsappLid, []);
    lidMap.get(c.whatsappLid).push(c);
  }

  const dupLids = [];
  for (const [k, list] of lidMap.entries()) {
    if (list.length > 1) {
      dupLids.push({
        lid: k,
        contacts: list.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          source: c.source,
          msgs: c.conversations.reduce((sum, cv) => sum + cv.messages.length, 0)
        }))
      });
    }
  }

  console.log('Duplicidades por whatsappLid:', dupLids.length);
  console.log(JSON.stringify(dupLids, null, 2));

  await prisma.$disconnect();
}

auditAllDuplicates().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/audit_all_duplicates.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/audit_all_duplicates.js', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => { out += d.toString(); });
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: process.env.VPS_PASSWORD || 'g@nY;+OWkSdi5.3D'
});

