const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany({
    select: { id: true, name: true, tags: true, city: true, state: true, cep: true, isFaturado: true, totalFaturado: true }
  });

  const dbTags = {};
  let withCep = 0;
  let fornecedores = 0;
  let revendas = 0;
  let clientes = 0;

  contacts.forEach(c => {
    if (c.cep) withCep++;
    const tLower = (c.tags || []).map(t => (t || '').toLowerCase());
    (c.tags || []).forEach(t => {
      dbTags[t] = (dbTags[t] || 0) + 1;
    });

    if (tLower.some(t => t.includes('fornecedor'))) fornecedores++;
    if (tLower.some(t => t.includes('revenda') || t.includes('concessionaria') || t.includes('parceiro'))) revendas++;
    if (c.isFaturado || tLower.some(t => t.includes('cliente'))) clientes++;
  });

  console.log('Total contacts in DB:', contacts.length);
  console.log('With CEP:', withCep);
  console.log('Fornecedores count:', fornecedores);
  console.log('Revendas count:', revendas);
  console.log('Clientes count:', clientes);
  console.log('Top DB Tags:', Object.entries(dbTags).sort((a,b) => b[1]-a[1]).slice(0, 25));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

