const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const remoteJid = '553598782626@s.whatsapp.net';
  const realPhone = null;
  const isLid = remoteJid.includes('@lid') || remoteJid.replace(/\\D/g, '').length > 13;
  const lidId = null; // evolutionMetadata?.remoteJid was probably 553598782626@s.whatsapp.net or undefined

  const phoneCandidates = new Set();
  const addPhoneVariants = (p) => {
    if (!p || p.includes('@lid')) return;
    const clean = p.replace(/\\D/g, '');
    if (clean.length >= 8) {
      phoneCandidates.add(clean);
      phoneCandidates.add('+' + clean);
      if (clean.startsWith('55') && clean.length === 13) {
        const without9 = clean.slice(0, 4) + clean.slice(5);
        phoneCandidates.add(without9);
        phoneCandidates.add('+' + without9);
      } else if (clean.startsWith('55') && clean.length === 12) {
        const with9 = clean.slice(0, 4) + '9' + clean.slice(4);
        phoneCandidates.add(with9);
        phoneCandidates.add('+' + with9);
      }
    }
  };

  addPhoneVariants(remoteJid);
  addPhoneVariants(realPhone);

  const phoneOrFilters = Array.from(phoneCandidates).map(p => ({ phone: p }));
  console.log('phoneOrFilters:', JSON.stringify(phoneOrFilters, null, 2));

  const existingContacts = await prisma.contact.findMany({
    where: {
      tenantId,
      OR: [
        ...phoneOrFilters,
      ],
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('Found contacts count:', existingContacts.length);
  for (const c of existingContacts) {
    console.log('Contact:', c.id, c.name, c.phone, c.createdAt);
  }

  await prisma.$disconnect();
}

run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/test_lookup.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/test_lookup.js', (err, stream) => {
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

