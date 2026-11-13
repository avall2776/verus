const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const nodeScript = `
const { PrismaClient } = require('/root/verus/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  const views = await prisma.whatsAppStatusView.findMany({
    where: { tenantId },
    orderBy: { viewedAt: 'desc' }
  });

  console.log('--- RESOLVENDO CONTATOS DOS VIEWERS ---');

  for (const v of views) {
    const rawLid = v.phone.replace('@lid', '').replace(/\\D/g, '');

    // 1. Busca por whatsappLid no banco
    let contact = await prisma.contact.findFirst({
      where: {
        tenantId,
        OR: [
          { whatsappLid: { contains: rawLid } },
          { phone: { contains: rawLid } }
        ]
      }
    });

    // 2. Se o contato atual tem phone que ainda é @lid ou inválido, tenta achar contato real por nome
    let realPhone = contact?.phone;
    let contactName = contact?.name || v.contactName;

    // Busca se existe outro contato no CRM com o mesmo nome ou similar
    if (contact && (!realPhone || realPhone.includes('@lid') || realPhone.length > 13)) {
      const candidates = await prisma.contact.findMany({
        where: {
          tenantId,
          name: { contains: contact.name.split(' ')[0], mode: 'insensitive' },
          NOT: { phone: { contains: '@lid' } }
        }
      });
      console.log('Candidates para ' + contact.name + ':', candidates.map(c => ({ name: c.name, phone: c.phone })));
      // Filtra exatamente
      const exact = candidates.find(c => c.name.toLowerCase() === contact.name.toLowerCase() || (contact.name.includes('Wesolowski') && c.name.includes('Wesolowski')));
      if (exact) {
        realPhone = exact.phone;
        contactName = exact.name;
      }
    }

    // Se ainda não achou, procura por nomes conhecidos
    const knownNames = [
      { key: '127504710955167', name: 'Maurício Wesolowski' },
      { key: '122522548838476', name: 'José Augusto Buissa' },
      { key: '153819992354947', name: 'Plinio Parisotto' },
      { key: '38075052875866', name: 'Lucas' },
      { key: '96843040075951', name: 'Júnior Ferreira' },
      { key: '207052471279812', name: 'Gabriel Do Carmo' },
      { key: '277824925614103', name: 'Gabriel' },
      { key: '215847943540795', name: 'Antonio Malvestitti Neto' },
      { key: '174380000751701', name: 'Marlon Z. Alves' },
      { key: '43212135755809', name: 'Lucas Gabriel' }
    ];

    const matchKnown = knownNames.find(k => rawLid.includes(k.key) || k.key.includes(rawLid));
    if (matchKnown) {
      const c = await prisma.contact.findFirst({
        where: {
          tenantId,
          name: { contains: matchKnown.name.split(' ')[0], mode: 'insensitive' },
          NOT: { phone: { contains: '@lid' } }
        }
      });
      if (c) {
        console.log('Achou por nome conhecido (' + matchKnown.name + ') -> ' + c.name + ' (' + c.phone + ')');
      }
    }

    console.log({
      viewId: v.id,
      originalPhone: v.phone,
      contactId: contact?.id,
      contactName,
      realPhone
    });
  }

  await prisma.$disconnect();
}
main().catch(console.error);
`;

  const remoteCmd = `node << 'EOF'
${nodeScript}
EOF
`;

  conn.exec(remoteCmd, (err, stream) => {
    if (err) throw err;
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '187.127.10.166',
  port: 22,
  username: 'root',
  password: 'g@nY;+OWkSdi5.3D'
});
