const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'whatsapp_status_posts';
  `);
  console.log('COLUMNS OF whatsapp_status_posts:', cols);

  const viewCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'whatsapp_status_views';
  `);
  console.log('COLUMNS OF whatsapp_status_views:', viewCols);
}

main().catch(console.error).finally(() => prisma.$disconnect());

