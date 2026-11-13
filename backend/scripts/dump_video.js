const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.$queryRawUnsafe(`
    SELECT id, "mediaUrl"
    FROM whatsapp_status_posts 
    WHERE id = 'story_1793390545975_eb5bb9'
  `);
  const base64Data = posts[0].mediaUrl.replace(/^data:video\/mp4;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(path.resolve(__dirname, '../../test_video.mp4'), buffer);
  console.log('Saved test_video.mp4, byte length:', buffer.length);
  await prisma.$disconnect();
}
main().catch(console.error);

