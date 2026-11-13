const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO SE EXISTEM MENSAGENS OU CONTATOS DOS NOMES ALIENÍGENAS ===');

  const checkLids = [
    { lid: '106794395418765@lid', name: 'Daniel Ropelato' },
    { lid: '57771756114015@lid', name: 'Daniel Weber' },
    { lid: '250728077643785@lid', name: 'Lucas - Executivo Godi' },
    { lid: '69320822546487@lid', name: 'Lucas Silva' },
    { lid: '77326893228134@lid', name: 'Vitor Vagno' },
    { lid: '78696836767897@lid', name: 'Vitor Ricken' },
    { lid: '72426654277676@lid', name: 'Antônio Ferreira Saraíva' },
    { lid: '87054809608255@lid', name: 'Anderson Zanin' },
    { lid: '27865848541187@lid', name: 'André Furlan' },
    { lid: '246076577738801@lid', name: 'Charles Resende' },
    { lid: '148185213317210@lid', name: 'Fernando Klein' },
    { lid: '222183037087879@lid', name: 'Paulo Henrique' },
    { lid: '55788034904319@lid', name: 'Pedro Henrique Thomas' },
    { lid: '157337704767718@lid', name: 'Evandro Rubio' }
  ];

  for (const item of checkLids) {
    // 1. Busca por contato existente com esse LID
    const cByLid = await prisma.contact.findFirst({
      where: { whatsappLid: item.lid },
      include: {
        conversations: {
          select: { id: true, status: true, updatedAt: true, _count: { select: { messages: true } } }
        }
      }
    });

    // 2. Busca por contato existente com o nome exato
    const cByName = await prisma.contact.findFirst({
      where: { name: { contains: item.name, mode: 'insensitive' } },
      include: {
        conversations: {
          select: { id: true, status: true, updatedAt: true, _count: { select: { messages: true } } }
        }
      }
    });

    console.log(`\nVerificando [${item.name}] (${item.lid}):`);
    if (cByLid) {
      console.log(`  -> Achou por LID: id=${cByLid.id}, name="${cByLid.name}", phone=${cByLid.phone}, convs=${JSON.stringify(cByLid.conversations)}`);
    } else {
      console.log(`  -> Nenhum contato gravado com esse LID.`);
    }

    if (cByName && cByName.id !== cByLid?.id) {
      console.log(`  -> Achou contato separado por Nome: id=${cByName.id}, name="${cByName.name}", phone=${cByName.phone}, lid=${cByName.whatsappLid}, convs=${JSON.stringify(cByName.conversations)}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

