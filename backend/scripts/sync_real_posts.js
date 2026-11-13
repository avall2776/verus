const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  const messageId = '3EB02EA7DB0AF04E55CDA4';
  const existing = await prisma.$queryRawUnsafe(
    'SELECT id FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "messageId" = $2 LIMIT 1;',
    tenantId,
    messageId
  );

  const thumb = 'data:image/jpeg;base64,/9j/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAASACADASIAAhEBAxEB/8QAGAABAQEBAQAAAAAAAAAAAAAABAACAwX/xAAoEAABAwIEBAcAAAAAAAAAAAABAAIDBREEEhUhEyMxQUJRVGFjg5L/xAAWAQEBAQAAAAAAAAAAAAAAAAADAQL/xAAbEQACAgMBAAAAAAAAAAAAAAAAAQIEAxExIf/aAAwDAQACEQMRAD8AJHTZT1bZLipY8SE2rygnnEe3CGy3rMnqLfUFiVxviMQowXT146SzJfKjT06PtZE1vEmJ0bca1ub4ggy4ioSG7akPwQijZnv0eVbG1rQQqUpAMaaBtsurQPIKUoyo/9k=';

  if (!existing || existing.length === 0) {
    const postId = `story_${Date.now()}_3eb02e`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "whatsapp_status_posts" ("id", "tenantId", "messageId", "title", "category", "mediaUrl", "postedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      postId,
      tenantId,
      messageId,
      'Linha Verto Agro - Colheitadeiras 2026',
      'Maquinários',
      thumb,
      new Date('2026-10-27T18:02:06.000Z')
    );
    console.log('Post 3EB02EA7DB0AF04E55CDA4 inserido com sucesso!');
  } else {
    console.log('Post já existe no banco.');
  }

  // Atualiza post 3EB0779B87CE066277CA15 com thumbnail se mediaUrl for null
  await prisma.$executeRawUnsafe(
    `UPDATE "whatsapp_status_posts" 
     SET "title" = 'Linha de Semeadeiras e Plantadeiras Verto',
         "category" = 'Maquinários',
         "mediaUrl" = COALESCE("mediaUrl", $1)
     WHERE "tenantId" = $2 AND "messageId" = '3EB0779B87CE066277CA15'`,
    thumb,
    tenantId
  );
  console.log('Post 3EB0779B87CE066277CA15 atualizado com título profissional e thumbnail.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
