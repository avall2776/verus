const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRawUnsafe(`
    SELECT id, "mediaUrl", "mediaType" 
    FROM "whatsapp_status_posts" 
    WHERE id = 'story_1793390545975_eb5bb9';
  `);
  if (!posts || posts.length === 0) return;
  const p = posts[0];
  let url = p.mediaUrl;
  if (url && url.includes('datavideo/mp4base64')) {
    const cleaned = url.replace('datavideo/mp4base64', '');
    await prisma.$executeRawUnsafe(
      `UPDATE "whatsapp_status_posts" SET "mediaUrl" = $1 WHERE id = $2`,
      cleaned,
      p.id
    );
    console.log('Fixed mediaUrl for story_1793390545975_eb5bb9! New start:', cleaned.substring(0, 50));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

