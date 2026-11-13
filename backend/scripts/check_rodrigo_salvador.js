const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO RODRIGO DIAS ===');
  const rodrigos = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Rodrigo Dias', mode: 'insensitive' } },
        { phone: { contains: '93495952' } },
        { phone: { contains: '195640625778752' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      }
    }
  });
  for (const r of rodrigos) {
    console.log('Contato:', r.id, r.name, r.phone, 'LID:', r.whatsappLid);
    for (const c of r.conversations) {
      console.log('  Conv:', c.id, c.status, 'Msgs:', c.messages.length);
      for (const m of c.messages) {
        console.log('    [' + m.direction + '] [' + m.status + '] [' + m.createdAt.toISOString() + '] ' + m.content);
      }
    }
  }

  console.log('=== VERIFICANDO SALVADOR NATAL GAIDA (74008492) ===');
  const salvadors = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Salvador', mode: 'insensitive' } },
        { phone: { contains: '74008492' } },
        { phone: { contains: '99948888600667' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      }
    }
  });
  for (const s of salvadors) {
    console.log('Contato:', s.id, s.name, s.phone, 'LID:', s.whatsappLid);
    for (const c of s.conversations) {
      console.log('  Conv:', c.id, c.status, 'Msgs:', c.messages.length);
      for (const m of c.messages) {
        console.log('    [' + m.direction + '] [' + m.status + '] [' + m.createdAt.toISOString() + '] ' + m.content);
      }
    }
  }

  console.log('=== VERIFICANDO JACKSON SOUSA (992351227) ===');
  const jacksons = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Jackson', mode: 'insensitive' } },
        { phone: { contains: '992351227' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      }
    }
  });
  for (const j of jacksons) {
    console.log('Contato:', j.id, j.name, j.phone, 'LID:', j.whatsappLid);
    for (const c of j.conversations) {
      console.log('  Conv:', c.id, c.status, 'Msgs:', c.messages.length);
      for (const m of c.messages) {
        console.log('    [' + m.direction + '] [' + m.status + '] [' + m.createdAt.toISOString() + '] ' + m.content);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_rodrigo_salvador.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_rodrigo_salvador.js', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
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

