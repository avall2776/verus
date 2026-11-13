const { Client } = require('ssh2');

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== BUSCA PROFUNDA DE MENSAGENS COM "Oi bom dia" e "Bom dia Blz" ===');
  
  const msgs1 = await prisma.message.findMany({
    where: {
      content: { contains: 'Oi bom dia', mode: 'insensitive' }
    },
    include: {
      conversation: {
        include: {
          contact: true
        }
      }
    }
  });
  console.log('Mensagens contendo "Oi bom dia":', msgs1.length);
  for (const m of msgs1) {
    console.log('MSG ID:', m.id, 'Direction:', m.direction, 'Created:', m.createdAt);
    console.log('  Content:', m.content);
    console.log('  Conv ID:', m.conversationId, 'Conv Status:', m.conversation?.status, 'assignedTo:', m.conversation?.assignedTo);
    console.log('  Contact:', m.conversation?.contact?.id, m.conversation?.contact?.name, m.conversation?.contact?.phone);
  }

  const msgs2 = await prisma.message.findMany({
    where: {
      content: { contains: 'Bom dia Blz', mode: 'insensitive' }
    },
    include: {
      conversation: {
        include: {
          contact: true
        }
      }
    }
  });
  console.log("--- Mensagens contendo Bom dia Blz: " + msgs2.length);
  for (const m of msgs2) {
    console.log('MSG ID:', m.id, 'Direction:', m.direction, 'Created:', m.createdAt);
    console.log('  Content:', m.content);
    console.log('  Conv ID:', m.conversationId, 'Conv Status:', m.conversation?.status, 'assignedTo:', m.conversation?.assignedTo);
    console.log('  Contact:', m.conversation?.contact?.id, m.conversation?.contact?.name, m.conversation?.contact?.phone);
  }

  // Verificar todas as conversas do contato Ale ou Silvio
  const contactsAle = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Ale', mode: 'insensitive' } },
        { phone: { contains: '81101375' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }
    }
  });
  console.log("--- Contatos encontrados com Ale ou 81101375: " + contactsAle.length);
  for (const c of contactsAle) {
    console.log('Contato:', c.id, c.name, c.phone);
    for (const conv of c.conversations) {
      console.log('  Conv:', conv.id, 'Status:', conv.status, 'assignedTo:', conv.assignedTo, 'updatedAt:', conv.updatedAt);
      for (const m of conv.messages) {
        console.log('    [' + m.direction + '] [' + m.createdAt.toISOString() + '] ' + m.content);
      }
    }
  }

  const contactsSilvio = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: 'Silvio', mode: 'insensitive' } },
        { phone: { contains: '84841099' } }
      ]
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }
    }
  });
  console.log("--- Contatos encontrados com Silvio ou 84841099: " + contactsSilvio.length);
  for (const c of contactsSilvio) {
    console.log('Contato:', c.id, c.name, c.phone);
    for (const conv of c.conversations) {
      console.log('  Conv:', conv.id, 'Status:', conv.status, 'assignedTo:', conv.assignedTo, 'updatedAt:', conv.updatedAt);
      for (const m of conv.messages) {
        console.log('    [' + m.direction + '] [' + m.createdAt.toISOString() + '] ' + m.content);
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
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/inspect_debug2.js');
    writeStream.write(scriptContent);
    writeStream.end();
    writeStream.on('close', () => {
      conn.exec('cd /root/verus/backend && node scripts/inspect_debug2.js', (err, stream) => {
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
