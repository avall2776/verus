const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  const contacts = await prisma.contact.findMany({
    where: {
      tenantId,
      OR: [
        { name: { contains: 'Letícia', mode: 'insensitive' } },
        { name: { contains: 'Leticia', mode: 'insensitive' } },
        { phone: { contains: '81359444' } },
        { phone: { contains: '9690' } }
      ]
    }
  });

  console.log('FOUND CONTACTS:');
  contacts.forEach(c => {
    console.log({
      id: c.id,
      name: c.name,
      phone: c.phone,
      whatsappLid: c.whatsappLid,
      tags: c.tags
    });
  });

  const views = await prisma.$queryRawUnsafe(
    'SELECT id, "contactId", phone, "contactName", "statusMessageId", "storyTitle" FROM "whatsapp_status_views" WHERE "tenantId" = $1 AND ("phone" LIKE \'%81359444%\' OR "phone" LIKE \'%9690%\' OR "contactName" LIKE \'%Leticia%\' OR "contactName" LIKE \'%Letícia%\');',
    tenantId
  );
  console.log('FOUND VIEWS:', views);
}

main().catch(console.error).finally(() => prisma.$disconnect());
