const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO CONVERSAS DOS CONTATOS AUDITADOS ===');
  
  // Lista dos LIDs e telefones mapeados da auditoria
  const auditItems = [
    { lid: '106794395418765@lid', name: 'Daniel Ropelato', phone: '554197258612' },
    { lid: '250728077643785@lid', name: 'Lucas - Executivo de Vendas na Godi', phone: '554699232511' },
    { lid: '77326893228134@lid', name: 'VITOR VAGNO', phone: '554998176031' },
    { lid: '184464550457567@lid', name: 'José lucimauro Oliveira', phone: '555491096408' },
    { lid: '169127658438678@lid', name: 'ANTÔNIO: JS   😎', phone: '556699861074' },
    { lid: '72426654277676@lid', name: 'Antônio Ferreira Saraíva', phone: '556699861074' },
    { lid: '87054809608255@lid', name: 'Anderson Zanin', phone: '555499500075' },
    { lid: '27865848541187@lid', name: 'André Furlan🚜🪗❤️', phone: '554291178020' },
    { lid: '246076577738801@lid', name: 'Charles Resende | Adm de Vendas JUMASA', phone: '559285155908' },
    { lid: '78696836767897@lid', name: 'Vitor Ricken', phone: '554998176031' },
    { lid: '148185213317210@lid', name: 'Fernando Klein', phone: '556281902383' },
    { lid: '57771756114015@lid', name: 'Daniel Weber', phone: '554197258612' },
    { lid: '44444757799094@lid', name: 'Thiago Buges', phone: '555492734866' },
    { lid: '222183037087879@lid', name: 'Paulo Henrique', phone: '5516994226943' },
    { lid: '55788034904319@lid', name: 'Pedro Henrique Thomas', phone: '555497047886' },
    { lid: '69320822546487@lid', name: 'Lucas Silva', phone: '554699232511' },
    { lid: '157337704767718@lid', name: 'Evandro Rubio', phone: '555491788479' },
    { lid: '234715751649323@lid', name: 'Carina Ceolin', phone: '555496008715' },
    { lid: '44345705140234@lid', name: 'Gerson Grandi', phone: '556599577629' },
    { lid: '89378386895009@lid', name: 'Eduardo Maltauro', phone: '555499260236' },
    { lid: '232959059693735@lid', name: 'Thiago De Castilho', phone: '555492734866' }
  ];

  for (const item of auditItems) {
    const contactsWithPhone = await prisma.contact.findMany({
      where: {
        OR: [
          { phone: item.phone },
          { whatsappLid: item.lid },
          { name: { contains: item.name.split(' ')[0] } }
        ]
      },
      select: {
        id: true,
        name: true,
        phone: true,
        whatsappLid: true,
        conversations: {
          select: {
            id: true,
            status: true,
            updatedAt: true,
            _count: { select: { messages: true } }
          }
        }
      }
    });

    console.log(`\nAuditando item: ${item.name} (${item.phone}) -> Contatos encontrados no DB: ${contactsWithPhone.length}`);
    for (const c of contactsWithPhone) {
      console.log(`  Contato: id=${c.id}, name="${c.name}", phone=${c.phone}, lid=${c.whatsappLid}, convs=${JSON.stringify(c.conversations)}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

