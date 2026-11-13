const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const faturados = await prisma.contact.findMany({
    where: {
      OR: [
        { isFaturado: true },
        { tags: { has: 'CLIENTE' } },
        { tags: { has: 'CLIENTE FATURADO' } }
      ]
    },
    select: { id: true, name: true, city: true, state: true, cep: true, isFaturado: true, totalFaturado: true }
  });

  let withCity = 0;
  let withoutCity = 0;

  faturados.forEach(f => {
    if (f.city && f.state) withCity++;
    else withoutCity++;
  });

  console.log(`Total faturados in DB: ${faturados.length}`);
  console.log(`With City & State: ${withCity}`);
  console.log(`Without City & State: ${withoutCity}`);

  await prisma.$disconnect();
}

main().catch(console.error);

