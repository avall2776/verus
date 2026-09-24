const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function reconcile() {
  console.log('--- INICIANDO RECONCILIAÇÃO E LIMPEZA DE CONTATOS NO VERSUS ---');

  // 1. Obter todos os usuários operadores para garantir que nenhum contato tenha nome de operador
  const operators = await prisma.user.findMany({ select: { name: true } });
  const operatorNames = operators.map(o => (o.name || '').trim().toLowerCase()).filter(Boolean);
  console.log('Operadores do sistema identificados:', operatorNames);

  // 2. Unificar contatos duplicados por telefone real e LID
  const allContacts = await prisma.contact.findMany({
    include: {
      conversations: {
        include: {
          messages: true,
        },
      },
    },
  });

  console.log(`Total de contatos encontrados: ${allContacts.length}`);

  // Mapear contatos com telefone real que possuem whatsappLid
  const realContactsByLid = new Map();
  for (const c of allContacts) {
    if (c.phone && !c.phone.includes('@lid') && c.whatsappLid) {
      realContactsByLid.set(c.whatsappLid, c);
    }
  }

  // Mesclar contatos duplicados onde o 'phone' era o LID
  for (const c of allContacts) {
    if (c.phone && c.phone.includes('@lid')) {
      const lidKey = c.phone.replace('@s.whatsapp.net', '');
      const primaryContact = realContactsByLid.get(lidKey) || realContactsByLid.get(c.whatsappLid);

      if (primaryContact && primaryContact.id !== c.id) {
        console.log(`Mesclando contato duplicado [${c.id}] (${c.name} - ${c.phone}) para contato primário [${primaryContact.id}] (${primaryContact.name} - ${primaryContact.phone})`);

        // Obter ou criar conversa primária
        let primaryConv = primaryContact.conversations[0];
        if (!primaryConv) {
          primaryConv = await prisma.conversation.findFirst({
            where: { tenantId: primaryContact.tenantId, contactId: primaryContact.id },
          });
        }

        // Migrar mensagens de cada conversa secundária
        for (const conv of c.conversations) {
          if (primaryConv) {
            await prisma.message.updateMany({
              where: { conversationId: conv.id },
              data: { conversationId: primaryConv.id, contactId: primaryContact.id },
            });
            // Apaga conversa secundária se não for a primária
            if (conv.id !== primaryConv.id) {
              await prisma.conversation.delete({ where: { id: conv.id } }).catch(() => {});
            }
          }
        }

        // Apaga o contato duplicado
        await prisma.contact.delete({ where: { id: c.id } }).catch(() => {});
      }
    }
  }

  // 3. Unificar contatos com mesmo telefone real (ex: Sophia)
  const realPhoneMap = new Map();
  const refreshedContacts = await prisma.contact.findMany({
    include: { conversations: { include: { messages: true } } },
  });

  for (const c of refreshedContacts) {
    if (c.phone && !c.phone.includes('@lid') && c.phone.length >= 8) {
      const cleanPhone = c.phone.replace(/\D/g, '');
      if (realPhoneMap.has(cleanPhone)) {
        const existing = realPhoneMap.get(cleanPhone);
        console.log(`Mesclando duplicata de telefone real: ${c.name} (${c.id}) -> ${existing.name} (${existing.id})`);

        const primaryConv = existing.conversations[0];
        for (const conv of c.conversations) {
          if (primaryConv && conv.id !== primaryConv.id) {
            await prisma.message.updateMany({
              where: { conversationId: conv.id },
              data: { conversationId: primaryConv.id, contactId: existing.id },
            });
            await prisma.conversation.delete({ where: { id: conv.id } }).catch(() => {});
          }
        }
        if (!existing.whatsappLid && c.whatsappLid) {
          await prisma.contact.update({ where: { id: existing.id }, data: { whatsappLid: c.whatsappLid } });
        }
        await prisma.contact.delete({ where: { id: c.id } }).catch(() => {});
      } else {
        realPhoneMap.set(cleanPhone, c);
      }
    }
  }

  // 4. Limpeza de nomes que batem com operadores ou são genéricos/mascarados
  const remainingContacts = await prisma.contact.findMany();
  for (const c of remainingContacts) {
    const cleanName = (c.name || '').trim();
    const isOpName = operatorNames.includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes('(você)');
    const isLidName = cleanName.includes('@lid') || cleanName === 'Cliente WhatsApp';

    if (isOpName || isLidName) {
      let newName = null;
      if (c.phone && !c.phone.includes('@lid')) {
        const clean = c.phone.replace(/\D/g, '');
        if (clean.length === 13 && clean.startsWith('55')) {
          newName = `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
        } else if (clean.length === 12 && clean.startsWith('55')) {
          newName = `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 8)}-${clean.slice(8)}`;
        } else if (clean.length >= 8) {
          newName = `+${clean}`;
        }
      }

      console.log(`Corrigindo contato [${c.id}]: '${c.name}' -> '${newName || 'Cliente WhatsApp'}'`);
      await prisma.contact.update({
        where: { id: c.id },
        data: {
          name: newName || 'Cliente WhatsApp',
          // Remove avatares que eram unsplash fictícios
          avatarUrl: (c.avatarUrl && c.avatarUrl.includes('unsplash.com')) ? null : c.avatarUrl,
        },
      });
    }
  }

  console.log('--- RECONCILIAÇÃO E LIMPEZA CONCLUÍDAS COM SUCESSO! ---');
}

reconcile()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((e) => {
    console.error('Erro na reconciliação:', e);
    prisma.$disconnect();
    process.exit(1);
  });
