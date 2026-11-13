const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== AUDITORIA PROFUNDA DE CADA UM DOS CONTATOS AFETADOS ===\n');

  // Os telefones que receberam mapeamento de LID por prefixo
  const mappedTargets = [
    { phone: '554197258612', nameOrig: 'Daniel', alienNames: ['Daniel Ropelato', 'Daniel Weber'] },
    { phone: '554699232511', nameOrig: 'Lucas', alienNames: ['Lucas - Executivo de Vendas na Godi', 'LUCAS POSSEBON GROSSELLI', 'Lucas Silva'] },
    { phone: '554998176031', nameOrig: 'Vitor', alienNames: ['VITOR VAGNO', 'Vitor Ricken'] },
    { phone: '555491096408', nameOrig: 'José', alienNames: ['José lucimauro Oliveira'] },
    { phone: '556699861074', nameOrig: 'Antônio 🇧🇷', alienNames: ['ANTÔNIO: JS   😎', 'Antônio Ferreira Saraíva'] },
    { phone: '555499500075', nameOrig: 'Anderson', alienNames: ['Anderson Zanin'] },
    { phone: '554291178020', nameOrig: 'André', alienNames: ['André Furlan🚜🪗❤️'] },
    { phone: '556992054275', nameOrig: 'Rodrigo Oliveira Figueredo', alienNames: ['Rodrigo Oliveira'] },
    { phone: '559285155908', nameOrig: 'Charles', alienNames: ['Charles Resende | Adm de Vendas JUMASA'] },
    { phone: '556281902383', nameOrig: 'Fernando', alienNames: ['Fernando Klein'] },
    { phone: '5516994226943', nameOrig: 'Paulo', alienNames: ['Paulo Henrique'] },
    { phone: '555497047886', nameOrig: 'Pedro Henrique ', alienNames: ['Pedro Henrique Thomas'] },
    { phone: '555491788479', nameOrig: 'Evandro', alienNames: ['Evandro Rubio'] },
    { phone: '555496008715', nameOrig: 'Carina', alienNames: ['Carina Ceolin'] },
    { phone: '556599577629', nameOrig: 'Gerson', alienNames: ['Gerson Grandi'] },
    { phone: '555499260236', nameOrig: 'Eduardo', alienNames: ['Eduardo Maltauro'] }
  ];

  for (const item of mappedTargets) {
    const contact = await prisma.contact.findFirst({
      where: { phone: item.phone },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 15
            }
          }
        }
      }
    });

    if (!contact) {
      console.log(`[NÃO ENCONTRADO] Telefone: ${item.phone} (${item.nameOrig})`);
      continue;
    }

    console.log(`\n--------------------------------------------------`);
    console.log(`CONTATO: id=${contact.id} | Nome="${contact.name}" | Telefone=${contact.phone} | LID=${contact.whatsappLid}`);
    console.log(`Aliens suspeitos: ${item.alienNames.join(', ')}`);
    
    for (const conv of contact.conversations) {
      console.log(`  CONVERSA id=${conv.id} | status=${conv.status} | updatedAt=${conv.updatedAt.toISOString()} | total msgs carregadas=${conv.messages.length}`);
      for (const m of conv.messages) {
        console.log(`    [${m.createdAt.toISOString()}] [${m.sender || (m.fromMe ? 'OUT' : 'IN')}] ${m.content?.substring(0, 70)}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

