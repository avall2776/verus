const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const migrations = await prisma.$queryRawUnsafe('SELECT * FROM "_prisma_migrations" ORDER BY finished_at DESC;');
  console.log('MIGRATIONS:', migrations);
}

main().catch(console.error).finally(() => prisma.$disconnect());

