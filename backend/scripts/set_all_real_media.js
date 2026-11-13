const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  
  // Find the post with real image
  const postWithMedia = await prisma.$queryRawUnsafe(
    `SELECT "mediaUrl" FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "mediaUrl" IS NOT NULL AND length("mediaUrl") > 1000 ORDER BY "postedAt" DESC LIMIT 1`,
    tenantId
  );

  if (postWithMedia && postWithMedia[0]?.mediaUrl) {
    const realMedia = postWithMedia[0].mediaUrl;
    console.log('Found real media url, length:', realMedia.length);
    
    // Update all active posts of today with this real media
    const updated = await prisma.$executeRawUnsafe(
      `UPDATE "whatsapp_status_posts" SET "mediaUrl" = $1, "postedAt" = '2026-10-26T12:25:00.000Z' WHERE "tenantId" = $2`,
      realMedia,
      tenantId
    );
    console.log('Updated status posts with real media and 09:25 BRT time. Count:', updated);

    // Also update whatsapp_status_views so thumbnails match
    const updatedViews = await prisma.$executeRawUnsafe(
      `UPDATE "whatsapp_status_views" SET "mediaUrl" = $1 WHERE "tenantId" = $2 AND ("mediaUrl" IS NULL OR length("mediaUrl") < 1000)`,
      realMedia,
      tenantId
    );
    console.log('Updated views with real media. Count:', updatedViews);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
