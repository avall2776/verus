const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "whatsapp_status_posts" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "whatsapp_status_views" ADD COLUMN IF NOT EXISTS "mediaType" TEXT DEFAULT 'image';`);
  console.log('Successfully added mediaType column to both tables in Supabase!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

