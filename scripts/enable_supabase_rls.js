const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

const TABLES_TO_PROTECT = [
  'Tenant',
  'User',
  'Contact',
  'Deal',
  'Proposal',
  'ProposalItem',
  'Contract',
  'Conversation',
  'Message',
  'CsatSurvey',
  'Automation',
  'AutomationLog',
  'Department',
  'Goal',
  'EmailMessage',
  'WhatsAppInstance',
  'WhatsAppConnectionHistory',
  'KnowledgeDocument',
  'DocumentChunk',
  'Workspace',
  'BusinessHours',
  'QuickReply',
  'SupportTicket',
  'TicketMessage',
  'TeamChannel',
  'TeamMessage',
  'EngineeringItem',
  'EngineeringChatMessage',
  'SuperAdmin',
  'Plan',
  'UserDepartment',
  'Channel'
];

async function main() {
  console.log('🔒 Iniciando aplicação de Row Level Security (RLS) no Supabase/PostgreSQL...');

  let enabledCount = 0;
  for (const table of TABLES_TO_PROTECT) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✅ RLS habilitado com sucesso na tabela: "${table}"`);
      enabledCount++;
    } catch (err) {
      console.warn(`  ⚠️ Aviso ao aplicar RLS na tabela "${table}":`, err.message);
    }
  }

  console.log(`\n🎉 Processo concluído: RLS ativo em ${enabledCount} de ${TABLES_TO_PROTECT.length} tabelas.`);

  // Teste de consulta do Prisma para confirmar que a aplicação continua 100% operacional
  const tenantCount = await prisma.tenant.count();
  const userCount = await prisma.user.count();
  console.log(`🔍 Verificação Prisma (Acesso DB Master): ${tenantCount} tenants, ${userCount} usuários carregados normalmente.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
