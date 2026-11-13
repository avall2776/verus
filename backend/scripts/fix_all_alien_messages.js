const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== AUDITORIA E DESVINCULAÇÃO DE MENSAGENS E LIDS DOS OUTROS NOMES ===\n');

  const fixPairs = [
    {
      name: 'Anderson Zanin',
      alienLid: '87054809608255@lid',
      wrongContactPhone: '555499500075', // Anderson
      realContactPhone: '5591981522072', // Anderson Zanin
      timestampGrep: '2026-11-02T17:57' // 14:57 BRT = 17:57 UTC
    },
    {
      name: 'Fernando Klein',
      alienLid: '148185213317210@lid',
      wrongContactPhone: '556281902383', // Fernando
      realContactPhone: '556681450019', // Fernando Klein
      timestampGrep: '2026-11-03T20:21' // 17:21 BRT = 20:21 UTC
    },
    {
      name: 'Pedro Henrique Thomas',
      alienLid: '55788034904319@lid',
      wrongContactPhone: '555497047886', // Pedro Henrique
      realContactPhone: '5594981171377', // Pedro Henrique Thomas
      timestampGrep: '2026-11-05'
    },
    {
      name: 'Evandro Rubio',
      alienLid: '157337704767718@lid',
      wrongContactPhone: '555491788479', // Evandro
      realContactPhone: '556699954299', // Evandro Rubio
      timestampGrep: '2026-11-05'
    },
    {
      name: 'Paulo Henrique Lorenzoni',
      alienLid: '222183037087879@lid',
      wrongContactPhone: '5516994226943', // Paulo Jerônimo
      realContactPhone: '5546999378779', // Paulo Henrique Lorenzoni
      timestampGrep: '2026-11-05'
    },
    {
      name: 'Daniel Ropelato',
      alienLid: '106794395418765@lid',
      wrongContactPhone: '554197258612', // Daniell Brito
      realContactPhone: '554199753604', // DANIEL ROPELATO
      timestampGrep: '2026-10-29'
    },
    {
      name: 'Lucas Silva',
      alienLid: '69320822546487@lid',
      wrongContactPhone: '554699232511', // Lucas
      realContactPhone: '554188679478', // Lucas Silva
      timestampGrep: '2026-11-05'
    }
  ];

  for (const pair of fixPairs) {
    console.log(`\nAnalisando: ${pair.name}...`);
    const wrongContact = await prisma.contact.findFirst({
      where: { phone: pair.wrongContactPhone },
      include: {
        conversations: {
          include: {
            messages: {
              where: {
                createdAt: {
                  gte: new Date(pair.timestampGrep + ':00.000Z'),
                  lte: new Date(pair.timestampGrep + ':59.999Z')
                }
              }
            }
          }
        }
      }
    });

    const realContact = await prisma.contact.findFirst({
      where: { phone: pair.realContactPhone },
      include: {
        conversations: true
      }
    });

    // Remove o alienLid se estiver associado ao contato errado
    if (wrongContact?.whatsappLid === pair.alienLid) {
      await prisma.contact.update({
        where: { id: wrongContact.id },
        data: { whatsappLid: null }
      });
      console.log(`  [LID Limpo] Removido ${pair.alienLid} de ${wrongContact.name}`);
    }

    // Associa o alienLid ao contato real se ele não tiver
    if (realContact && !realContact.whatsappLid) {
      await prisma.contact.update({
        where: { id: realContact.id },
        data: { whatsappLid: pair.alienLid }
      });
      console.log(`  [LID Atribuído] ${pair.alienLid} vinculado ao contato correto: ${realContact.name}`);
    }

    // Verifica mensagens
    const foundMsgs = [];
    for (const c of wrongContact?.conversations || []) {
      foundMsgs.push(...c.messages);
    }
    console.log(`  Mensagens encontradas no timestamp aproximado: ${foundMsgs.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

