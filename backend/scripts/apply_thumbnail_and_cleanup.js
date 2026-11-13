const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('1. Adding thumbnailUrl column to whatsapp_status_posts...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "whatsapp_status_posts" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
  `);

  console.log('2. Updating story_1793390545975_eb5bb9 with test_frame.jpg thumbnail...');
  const frameBuf = fs.readFileSync(path.resolve(__dirname, '../../test_frame.jpg'));
  const frameBase64 = `data:image/jpeg;base64,${frameBuf.toString('base64')}`;
  
  await prisma.$executeRawUnsafe(
    `UPDATE "whatsapp_status_posts" 
     SET "thumbnailUrl" = $1 
     WHERE id = 'story_1793390545975_eb5bb9'`,
    frameBase64
  );

  console.log('3. Deleting any orphan dummy posts with NULL mediaUrl...');
  const delRes = await prisma.$executeRawUnsafe(`
    DELETE FROM "whatsapp_status_posts" 
    WHERE "mediaUrl" IS NULL AND title = 'Status Comercial WhatsApp'
  `);
  console.log('Deleted dummy posts:', delRes);

  const posts = await prisma.$queryRawUnsafe(`
    SELECT id, title, "mediaType", length("mediaUrl") as media_len, length("thumbnailUrl") as thumb_len, "postedAt"
    FROM "whatsapp_status_posts"
    WHERE "tenantId" = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126'
    ORDER BY "postedAt" DESC
  `);
  console.log('Verto posts after update:', posts);

  await prisma.$disconnect();
}
main().catch(console.error);

