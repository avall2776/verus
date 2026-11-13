const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const post = await prisma.$queryRawUnsafe(`
    SELECT id, title, "mediaType", SUBSTRING("mediaUrl", 1, 100) as start_str
    FROM "whatsapp_status_posts"
    WHERE id = 'story_1793390545975_eb5bb9';
  `);
  console.log('START STR:', post);
}

main().catch(console.error).finally(() => prisma.$disconnect());

