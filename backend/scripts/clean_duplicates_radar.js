const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMediaTypeColumn() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "whatsapp_status_posts" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';
    ALTER TABLE "whatsapp_status_views" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';
  `);
  console.log('Coluna mediaType adicionada com sucesso!');
}

addMediaTypeColumn().catch(console.error).finally(() => prisma.$disconnect());

