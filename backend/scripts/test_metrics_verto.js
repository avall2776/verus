const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  const contactsCount = await prisma.contact.count({ where: { tenantId } });
  const dealsCount = await prisma.deal.count({
    where: {
      tenantId,
      status: { in: ['lead', 'contacted', 'proposal', 'negotiation', 'follow-up'] },
    },
  });
  console.log('Contacts:', contactsCount);
  console.log('Deals:', dealsCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());

