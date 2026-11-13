const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  
  const rawViews = await prisma.$queryRawUnsafe(
    `SELECT v.id, v.phone, v."contactName", v."storyTitle", v.category, v."viewedAt" 
     FROM "whatsapp_status_views" v
     WHERE v."tenantId" = $1
     ORDER BY v."viewedAt" DESC`,
    tenantId
  );

  console.log(`Total de visualizadores reais: ${rawViews.length}`);
  for (const v of rawViews) {
    const nameLower = (v.contactName || '').toLowerCase();
    const isInternalTeam =
      nameLower.includes('verto') ||
      nameLower.includes('plinio parisotto') ||
      nameLower.includes('junior verto') ||
      nameLower.includes('colaborador') ||
      nameLower.includes('funcionario') ||
      nameLower.includes('institucional');

    const status = isInternalTeam ? 'Equipe Interna (Verto)' : (v.contactName?.includes('Wesolowski') || v.contactName?.includes('Buissa') ? 'Em Negociação' : 'Potencial Comprador');
    console.log(`- ${v.contactName} | ${v.phone} | Status: ${status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
