const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'fc89e34b-2bc5-462d-9bfd-45b06e1d0126';
  
  // 1. Check Active Story Post
  const posts = await prisma.$queryRawUnsafe(`SELECT id, "messageId", title, category, "mediaUrl", "postedAt" FROM "whatsapp_status_posts" WHERE "tenantId" = $1 ORDER BY "postedAt" DESC LIMIT 5`, tenantId);
  console.log('--- ACTIVE STORY POSTS ---');
  for (const p of posts) {
    console.log({
      id: p.id,
      title: p.title,
      category: p.category,
      hasMedia: !!p.mediaUrl,
      mediaLength: p.mediaUrl ? p.mediaUrl.length : 0,
      postedAt: p.postedAt
    });
  }

  // 2. Check Viewers
  const views = await prisma.$queryRawUnsafe(`SELECT id, phone, "contactName", city, state, "storyTitle", category, "viewedAt" FROM "whatsapp_status_views" WHERE "tenantId" = $1 ORDER BY "viewedAt" DESC`, tenantId);
  console.log(`\n--- VIEWS (Total: ${views.length}) ---`);
  for (const v of views) {
    console.log(`- ${v.contactName || 'Sem Nome'} | ${v.phone} | ${v.viewedAt}`);
  }

  // 3. Check Deals
  const deals = await prisma.deal.findMany({
    where: { tenantId },
    select: { id: true, title: true, value: true, status: true, contact: { select: { name: true, phone: true } } }
  });
  console.log(`\n--- DEALS IN CRM (Total: ${deals.length}) ---`);
  for (const d of deals) {
    console.log(`- Deal: "${d.title}" | R$ ${d.value} | Status: ${d.status} | Contato: ${d.contact?.name} (${d.contact?.phone})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
