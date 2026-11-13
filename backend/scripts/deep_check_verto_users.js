const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. TODOS OS TENANTS ===');
  const tenants = await prisma.tenant.findMany();
  tenants.forEach(t => console.log(`ID: ${t.id} | Nome: "${t.name}" | Email: "${t.email}" | Criado: ${t.createdAt}`));

  console.log('\n=== 2. TODOS OS USUÁRIOS ===');
  const users = await prisma.user.findMany({
    include: {
      tenant: { select: { name: true } },
      departments: { include: { department: true } }
    }
  });
  users.forEach(u => console.log(`ID: ${u.id} | Nome: "${u.name}" | Email: "${u.email}" | Tenant: "${u.tenant?.name}" (${u.tenantId}) | Role: ${u.role} | Criado: ${u.createdAt}`));

  console.log('\n=== 3. PROCURANDO QUALQUER MENÇÃO A NOMES OU EMAILS DA VERTO EM OUTRAS TABELAS ===');
  // Verificar mensagens
  const vertoMsgs = await prisma.message.findMany({
    where: {
      tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126',
      senderName: { not: null }
    },
    select: { senderName: true },
    distinct: ['senderName']
  });
  console.log('Remetentes distintos em Mensagens de Verto:', vertoMsgs);

  // Verificar tickets de suporte
  const tickets = await prisma.supportTicket.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126' },
    include: { user: true }
  });
  console.log('Tickets de Verto:', tickets.map(t => ({ id: t.id, title: t.title, user: t.user?.name, userEmail: t.user?.email })));

  // Verificar conversations e assignedTo
  const convs = await prisma.conversation.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126', assignedTo: { not: null } },
    select: { id: true, assignedTo: true },
    distinct: ['assignedTo']
  });
  console.log('assignedTo em Conversations de Verto:', convs);

  // Verificar deals e assignedTo
  const deals = await prisma.deal.findMany({
    where: { tenantId: 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126', assignedTo: { not: null } },
    select: { id: true, assignedTo: true },
    distinct: ['assignedTo']
  });
  console.log('assignedTo em Deals de Verto:', deals);

  // Verificar se há alguma tabela de audit / logs
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Tabelas existentes no banco:', tables.map(t => t.table_name));
}

main().catch(console.error).finally(() => prisma.$disconnect());

