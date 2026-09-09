const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    UPDATE tenants 
    SET "metaToken" = 'EAAVZAjwAnC4UBSUCsPJyoU68zkPVHFh0nCZAywz0IPUkhFj6pgZBSWj7SwQQvDJUxPDj28EY1UCzsOWEpX1ffecT2mbrHIxEI39bEUwXpODFe1uvD5VTZBWTYED9xRNATZAjUfRcCUEXTuGWSVUGURtbalCtTxZC8ZA3rYGcsBihiUe7w7ZAwHT8byUm8wu9KhRQfgZDZD',
        "metaPhoneNumberId" = '1165234936683099'
    WHERE id = 'tenant_123'
  `);

  console.log('Chaves da Meta injetadas com sucesso via SQL Direto no tenant_123!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
