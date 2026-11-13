const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRawUnsafe(`
    SELECT id, title, "mediaType", length("mediaUrl") as len, substring("mediaUrl", 1, 80) as pref, substring("mediaUrl", length("mediaUrl") - 40) as suff
    FROM whatsapp_status_posts 
    ORDER BY "postedAt" DESC 
    LIMIT 5
  `);
  console.log(posts);
  await prisma.$disconnect();
}
main().catch(console.error);
