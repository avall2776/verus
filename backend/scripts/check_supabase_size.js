const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDbSize() {
  try {
    const sizeResult = await prisma.$queryRawUnsafe(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;
    `);
    console.log('Tamanho total do banco no Supabase:', sizeResult);

    const counts = await prisma.$queryRawUnsafe(`
      SELECT
        (SELECT count(*) FROM "Contact") as contacts,
        (SELECT count(*) FROM "Message") as messages,
        (SELECT count(*) FROM "Conversation") as conversations,
        (SELECT count(*) FROM "Deal") as deals,
        (SELECT count(*) FROM "User") as users,
        (SELECT count(*) FROM "Tenant") as tenants;
    `);
    console.log('Contagens de registros principais:', counts);
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbSize();

