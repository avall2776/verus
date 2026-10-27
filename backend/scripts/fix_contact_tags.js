const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';

async function main() {
  console.log('Fixing contact tags for Letícia and Verto clients...');
  
  // Letícia Barichello
  await prisma.contact.update({
    where: { id: 'd3bdf705-256b-476d-8457-93e6c2fe5431' },
    data: { tags: ['Cliente', 'Potencial Comprador'] },
  });

  // Comercial Verto
  await prisma.contact.update({
    where: { id: '1f2607ca-2a24-4b04-ac12-39c6da7b0f41' },
    data: { tags: ['Cliente', 'Potencial Comprador'] },
  });

  console.log('Contacts updated successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
