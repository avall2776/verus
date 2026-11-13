const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('TABELAS NO BANCO:');
  console.log(tables.map(t => t.table_name));

  // Verificar se existe alguma tabela de operators ou algo parecido
  const allUsersRaw = await prisma.$queryRawUnsafe('SELECT * FROM "User";');
  console.log('TOTAL ROWS NA TABELA User:', allUsersRaw.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());

