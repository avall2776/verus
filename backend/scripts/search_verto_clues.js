const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buscar se há notas de deals com nomes de vendedores/atendentes
  const deals = await prisma.deal.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' },
    select: { title: true, notes: true, metadata: true }
  });
  console.log('Total de deals em Verto:', deals.length);
  const notesWithNames = deals.filter(d => d.notes || d.metadata);
  console.log('Deals com notes/metadata:', notesWithNames.slice(0, 10));

  // Verificar se há quick replies da Verto com nomes
  const quickReplies = await prisma.quickReply.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' },
  });
  console.log('Quick Replies da Verto:', quickReplies.map(q => ({ title: q.title, shortcut: q.shortcut })));

  // Verificar instâncias de WhatsApp da Verto
  const instances = await prisma.whatsAppInstance.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' },
  });
  console.log('Instâncias WhatsApp da Verto:', instances.map(i => ({ name: i.name, phone: i.phoneNumber })));
}

main().catch(console.error).finally(() => prisma.$disconnect());

