const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeAllPhoneDuplicates() {
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

  let mergedCount = 0;
  for (const [cleanPhone, list] of phoneMap.entries()) {
    if (list.length <= 1) continue;

    // Ordena para escolher o melhor contato "master":
    // 1. Quem tem mais mensagens
    // 2. Quem tem Lead/Meta Ads/Omie
    // 3. Quem foi criado antes
    list.sort((a, b) => {
      const aMsgs = a.conversations.reduce((sum, cv) => sum + cv.messages.length, 0);
      const bMsgs = b.conversations.reduce((sum, cv) => sum + cv.messages.length, 0);
      if (bMsgs !== aMsgs) return bMsgs - aMsgs;
      const aHasLead = a.source === 'Meta Ads' || a.source === 'Omie ERP';
      const bHasLead = b.source === 'Meta Ads' || b.source === 'Omie ERP';
      if (aHasLead && !bHasLead) return -1;
      if (!aHasLead && bHasLead) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const master = list[0];
    const duplicates = list.slice(1);

    for (const dup of duplicates) {
      // Pega conversa master
      let masterConv = master.conversations[0];
      for (const dupConv of dup.conversations) {
        if (!masterConv) {
          // Se o master não tinha conversa, transfere a do dup
          await prisma.conversation.update({
            where: { id: dupConv.id },
            data: { contactId: master.id }
          });
          masterConv = dupConv;
        } else {
          // Move mensagens da dupConv para masterConv
          await prisma.message.updateMany({
            where: { conversationId: dupConv.id },
            data: { conversationId: masterConv.id, contactId: master.id }
          });
          await prisma.conversation.delete({ where: { id: dupConv.id } }).catch(() => {});
        }
      }

      await prisma.message.updateMany({
        where: { contactId: dup.id },
        data: { contactId: master.id, ...(masterConv ? { conversationId: masterConv.id } : {}) }
      });
      await prisma.deal.updateMany({
        where: { contactId: dup.id },
        data: { contactId: master.id }
      });
      await prisma.supportTicket.updateMany({
        where: { contactId: dup.id },
        data: { contactId: master.id }
      });

      // Atualiza whatsappLid do master se ele não tiver
      if (dup.whatsappLid && !master.whatsappLid) {
        await prisma.contact.update({
          where: { id: master.id },
          data: { whatsappLid: dup.whatsappLid }
        });
      }

      await prisma.contact.delete({ where: { id: dup.id } }).catch((err) => {
        console.error('Erro ao deletar dup ' + dup.id + ':', err.message);
      });
      mergedCount++;
    }
  }

  console.log(\`✅ Unificação concluída: \${mergedCount} contatos duplicados mesclados no tenant \${tenantId}.\`);
  await prisma.$disconnect();
}

mergeAllPhoneDuplicates().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream('/root/verus/backend/scripts/merge_all_duplicates.js');
    writeStream.write(scriptContent);
    writeStream.end(() => {
      conn.exec('cd /root/verus/backend && node scripts/merge_all_duplicates.js', (err, stream) => {
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

